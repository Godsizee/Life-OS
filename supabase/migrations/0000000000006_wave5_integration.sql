-- Welle 5: Vernetzung & Kohärenz
-- Vollständig idempotent (IF NOT EXISTS / DO-Guards) — kann gefahrlos mehrfach im
-- Supabase Studio ausgeführt werden. RLS folgt der Projekt-Konvention is_member(workspace_id).

-- ── 5.2 Goal-Hub: Ziel-Typen (Standard vs. Personal-Record-Ziel) ──────────────
alter table goals add column if not exists goal_type text not null default 'standard';
alter table goals add column if not exists target_exercise text;
alter table goals add column if not exists target_value numeric;

-- ── 5.2 Habit → Goal (kann in prod bereits existieren; idempotent) ────────────
alter table habits add column if not exists goal_id uuid references goals on delete set null;

-- ── 5.5 Journal-Auto-Kontext: eingefrorener Tages-Snapshot ────────────────────
alter table journal_entries add column if not exists context jsonb;

-- ── 5.1 Universal-Links: polymorphe Verknüpfung beliebiger Objekte ────────────
create table if not exists entity_links (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (source_type, source_id, target_type, target_id)
);
alter table entity_links enable row level security;

-- ── 3.3 Zeiterfassung: time_entries (Pomodoro-/manuelle Einträge pro Task) ─────
create table if not exists time_entries (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  user_id uuid references auth.users not null,
  task_id uuid references tasks on delete set null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone,
  duration_min numeric not null default 0,
  source text not null default 'manual',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table time_entries enable row level security;

-- ── 5.3 Fitness: personal_records (ein Datensatz pro Übung, geschätztes 1RM) ───
create table if not exists personal_records (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  user_id uuid references auth.users not null,
  exercise_name text not null,
  weight_kg numeric not null,
  reps integer not null,
  est_1rm numeric not null,
  achieved_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (workspace_id, user_id, exercise_name)
);
alter table personal_records enable row level security;

-- ── RLS-Policies (idempotent via pg_policies-Guard) ───────────────────────────
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'entity_links' and policyname = 'members rw') then
    create policy "members rw" on entity_links
      using (is_member(workspace_id)) with check (is_member(workspace_id));
  end if;

  -- time_entries sind persönlich: Mitgliedschaft UND Autorenschaft.
  if not exists (select 1 from pg_policies where tablename = 'time_entries' and policyname = 'owner and member') then
    create policy "owner and member" on time_entries
      using (user_id = auth.uid() and is_member(workspace_id))
      with check (user_id = auth.uid() and is_member(workspace_id));
  end if;

  -- personal_records sind persönlich (eigene Kraftwerte), aber im Workspace-Kontext.
  if not exists (select 1 from pg_policies where tablename = 'personal_records' and policyname = 'owner and member') then
    create policy "owner and member" on personal_records
      using (user_id = auth.uid() and is_member(workspace_id))
      with check (user_id = auth.uid() and is_member(workspace_id));
  end if;
end $$;

-- ── Realtime-Publication (idempotent via duplicate_object-Guard) ──────────────
do $$
begin
  alter publication supabase_realtime add table entity_links;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table time_entries;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table personal_records;
exception when duplicate_object then null;
end $$;
