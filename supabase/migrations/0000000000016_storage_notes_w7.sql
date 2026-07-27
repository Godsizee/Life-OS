-- W7 Storage-Infra + Notizen-Ausbau (Apple-Notes-Niveau).
--   1) privater Storage-Bucket "attachments" + Policies auf storage.objects
--   2) generische Tabelle "attachments" (entity_type/entity_id — Muster entity_links)
--   3) notes: private + created_by, RLS auf Privatsphaere umgestellt
-- Idempotent (mehrfach ausfuehrbar).

-- ── 0) Hilfsfunktion: Workspace-UUID aus dem Storage-Pfad ────────────────────
-- Pfad-Konvention: <workspace_id>/<entity_type>/<entity_id>/<uuid>.<ext>
-- Liefert NULL, wenn das erste Segment keine UUID ist — so wirft die Policy
-- keinen Cast-Fehler; is_member(null) ist false, der Zugriff also verweigert.
create or replace function public.storage_workspace_id(path text)
returns uuid
language sql
immutable
as $$
  select case
    when split_part(path, '/', 1)
         ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(path, '/', 1)::uuid
    else null
  end;
$$;

grant execute on function public.storage_workspace_id(text) to authenticated;

-- ── 1) Tabelle attachments (polymorph, Muster entity_links) ──────────────────
create table if not exists public.attachments (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces on delete cascade not null,
  entity_type text not null,
  entity_id uuid not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes integer not null default 0,
  width integer,
  height integer,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.attachments enable row level security;

create index if not exists attachments_entity_idx
  on public.attachments (workspace_id, entity_type, entity_id, created_at);

-- ── 2) notes: Privatsphaere + Autor ──────────────────────────────────────────
alter table public.notes add column if not exists private boolean not null default false;
alter table public.notes add column if not exists created_by uuid references auth.users;

-- Bestandszeilen: der letzte Bearbeiter gilt als Autor (updated_by ist not null).
update public.notes set created_by = updated_by where created_by is null;

create index if not exists notes_workspace_updated_idx
  on public.notes (workspace_id, pinned desc, updated_at desc);

-- ── 3) RLS notes: "members rw" durch privatsphaere-bewusste Policies ersetzen ─
-- Erst alles droppen, dann anlegen => beliebig oft ausfuehrbar.
drop policy if exists "members rw" on public.notes;
drop policy if exists "notes read"   on public.notes;
drop policy if exists "notes insert" on public.notes;
drop policy if exists "notes update" on public.notes;
drop policy if exists "notes delete" on public.notes;

create policy "notes read" on public.notes for select
  using (public.is_member(workspace_id) and (private = false or created_by = auth.uid()));

create policy "notes insert" on public.notes for insert
  with check (public.is_member(workspace_id) and (private = false or created_by = auth.uid()));

create policy "notes update" on public.notes for update
  using      (public.is_member(workspace_id) and (private = false or created_by = auth.uid()))
  with check (public.is_member(workspace_id) and (private = false or created_by = auth.uid()));

create policy "notes delete" on public.notes for delete
  using (public.is_member(workspace_id) and (private = false or created_by = auth.uid()));

-- ── 4) RLS attachments ───────────────────────────────────────────────────────
-- Lesen/Loeschen delegiert die Sichtbarkeit an die Ziel-Entitaet: Der EXISTS-Test
-- laeuft selbst unter RLS, eine private Notiz ist damit auch fuer ihre Anhaenge
-- unsichtbar. Entity-Typen ohne eigene Privatsphaere greifen den Zweig nicht an.
do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'attachments'
                   and policyname = 'attachments read') then
    create policy "attachments read" on public.attachments for select
      using (
        public.is_member(workspace_id)
        and (entity_type <> 'note'
             or exists (select 1 from public.notes n where n.id = attachments.entity_id))
      );
  end if;

  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'attachments'
                   and policyname = 'attachments insert') then
    create policy "attachments insert" on public.attachments for insert
      with check (public.is_member(workspace_id) and created_by = auth.uid());
  end if;

  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'attachments'
                   and policyname = 'attachments delete') then
    create policy "attachments delete" on public.attachments for delete
      using (
        public.is_member(workspace_id)
        and (entity_type <> 'note'
             or exists (select 1 from public.notes n where n.id = attachments.entity_id))
      );
  end if;
end $$;

-- Kein UPDATE-Recht: Anhaenge sind unveraenderlich (anlegen + loeschen).

-- ── 5) Storage-Bucket "attachments" (privat) ─────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── 6) Policies auf storage.objects ──────────────────────────────────────────
-- SELECT/DELETE spiegeln die attachments-Zeile (und damit die Notiz-Sichtbarkeit).
-- INSERT prueft nur die Workspace-Mitgliedschaft, weil die Zeile beim Upload
-- bereits existiert bzw. unmittelbar davor geschrieben wird.
do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'storage' and tablename = 'objects'
                   and policyname = 'attachments read') then
    create policy "attachments read" on storage.objects for select
      using (
        bucket_id = 'attachments'
        and exists (select 1 from public.attachments a where a.storage_path = objects.name)
      );
  end if;

  if not exists (select 1 from pg_policies
                 where schemaname = 'storage' and tablename = 'objects'
                   and policyname = 'attachments write') then
    create policy "attachments write" on storage.objects for insert
      with check (
        bucket_id = 'attachments'
        and public.is_member(public.storage_workspace_id(name))
      );
  end if;

  if not exists (select 1 from pg_policies
                 where schemaname = 'storage' and tablename = 'objects'
                   and policyname = 'attachments delete') then
    create policy "attachments delete" on storage.objects for delete
      using (
        bucket_id = 'attachments'
        and exists (select 1 from public.attachments a where a.storage_path = objects.name)
      );
  end if;
end $$;

-- ── 7) Realtime ──────────────────────────────────────────────────────────────
do $$
begin
  alter publication supabase_realtime add table public.attachments;
exception when duplicate_object then null;
end $$;
