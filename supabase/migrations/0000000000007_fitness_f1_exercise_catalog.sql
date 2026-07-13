-- Fitness Welle F1: Übungskatalog + Datenmodell v2 (Cardio/Duration, RPE)
-- Idempotent (IF NOT EXISTS / DO-Guards), Konvention wie 0000000000006_wave5_integration.sql.
--
-- Hinweis: workout_plans/workout_exercises/workout_logs/workout_set_logs existieren
-- bereits live, wurden aber nie als `create table` in dieser Migrationshistorie erfasst.
-- Diese Migration rekonstruiert die Basis-Tabellen NICHT (Risiko falscher Annahmen über
-- Constraints/RLS), sondern ändert sie ausschließlich additiv.

-- ── Neuer Übungskatalog: global (workspace_id null) + Custom pro Workspace ────
create table if not exists exercise_catalog (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade,
  name_de text not null,
  name_en text,
  exercise_type text not null default 'strength', -- 'strength' | 'cardio' | 'duration'
  muscle_group text,
  equipment text,
  source text not null default 'custom', -- 'wger' | 'custom'
  external_id text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);
create unique index if not exists exercise_catalog_external_id_uq
  on exercise_catalog (external_id) where external_id is not null;
alter table exercise_catalog enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'exercise_catalog' and policyname = 'members write own') then
    create policy "members write own" on exercise_catalog
      for all using (workspace_id is not null and is_member(workspace_id))
      with check (workspace_id is not null and is_member(workspace_id));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'exercise_catalog' and policyname = 'read global or member') then
    create policy "read global or member" on exercise_catalog
      for select using (workspace_id is null or is_member(workspace_id));
  end if;
end $$;

do $$
begin
  alter publication supabase_realtime add table exercise_catalog;
exception when duplicate_object then null;
end $$;

-- ── Datenmodell v2: Cardio-Felder + Katalog-Verknüpfung + RPE ─────────────────
alter table workout_exercises add column if not exists exercise_id uuid references exercise_catalog on delete set null;
alter table workout_exercises add column if not exists exercise_type text not null default 'strength';
alter table workout_exercises add column if not exists default_duration_min numeric;
alter table workout_exercises add column if not exists default_distance_km numeric;

alter table workout_set_logs alter column reps drop not null;
alter table workout_set_logs add column if not exists exercise_id uuid references exercise_catalog on delete set null;
alter table workout_set_logs add column if not exists exercise_type text not null default 'strength';
alter table workout_set_logs add column if not exists duration_min numeric;
alter table workout_set_logs add column if not exists distance_km numeric;
alter table workout_set_logs add column if not exists rpe smallint;
