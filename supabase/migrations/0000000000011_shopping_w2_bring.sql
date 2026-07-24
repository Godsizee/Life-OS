-- W2 Einkauf-Ausbau (Bring!-Niveau): Kategorien, Artikel-Notiz, Zuletzt-gekauft-Historie,
-- geteilte Workspace-Einstellungen (Ladenlayout). Idempotent (mehrfach ausführbar).

-- 1) shopping_items: neue Spalten (select('*') liest sie automatisch mit).
alter table shopping_items add column if not exists category text;
alter table shopping_items add column if not exists note text;
alter table shopping_items add column if not exists checked_at timestamptz;

create index if not exists shopping_items_checked_at_idx
  on shopping_items (workspace_id, checked_at desc)
  where checked_at is not null;

-- 2) workspace_settings: geteilte, von JEDEM Mitglied schreibbare Einstellungen.
--    Eigene Tabelle statt workspaces.settings, weil workspaces nur der Owner updaten darf
--    (owner-only UPDATE-Policy in 0000000000000) — die Kategorie-Reihenfolge soll aber
--    jedes Mitglied ändern können.
create table if not exists workspace_settings (
  workspace_id uuid references workspaces on delete cascade primary key,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table workspace_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'workspace_settings' and policyname = 'members rw'
  ) then
    create policy "members rw" on workspace_settings
      using (is_member(workspace_id)) with check (is_member(workspace_id));
  end if;
end $$;

do $$
begin
  alter publication supabase_realtime add table workspace_settings;
exception when duplicate_object then null;
end $$;
