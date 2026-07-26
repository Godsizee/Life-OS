-- W3 Kalender-Ausbau (Google-Calendar-Niveau): Teilnehmer + Serien-Ausnahmen.
-- Idempotent (mehrfach ausführbar). Occurrence-Expansion passiert CLIENT-seitig
-- (occurrences.ts) — hier nur Speicher für Teilnehmer und Ausnahmen.

-- 1) events: interne Teilnehmer (Workspace-Mitglieder). select('*') liest die Spalte
--    automatisch mit; Default leeres Array, damit bestehende Zeilen gültig bleiben.
alter table events add column if not exists attendee_ids uuid[] not null default '{}';

-- 2) event_overrides: eine Ausnahme je (Serie, Original-Occurrence-Datum).
--    cancelled = true  -> diese eine Occurrence entfällt.
--    patch (jsonb)     -> Teil-Override dieser einen Occurrence:
--                         { "start": iso, "end": iso, "title": text, "location": text|null }
--    occurrence_date  = das URSPRÜNGLICHE Datum des Slots (yyyy-mm-dd, lokal) —
--                        Nachschlage-Schlüssel gegen die client-seitige Expansion.
create table if not exists event_overrides (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  event_id uuid references events on delete cascade not null,
  occurrence_date date not null,
  cancelled boolean not null default false,
  patch jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (event_id, occurrence_date)
);

create index if not exists event_overrides_event_idx
  on event_overrides (workspace_id, event_id);

alter table event_overrides enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'event_overrides' and policyname = 'members rw'
  ) then
    create policy "members rw" on event_overrides
      using (is_member(workspace_id)) with check (is_member(workspace_id));
  end if;
end $$;

do $$
begin
  alter publication supabase_realtime add table event_overrides;
exception when duplicate_object then null;
end $$;
