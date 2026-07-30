-- Baseline fuer die fuenf Tabellen, die live existieren, aber nie als
-- `create table` in dieser Migrationshistorie erfasst wurden (siehe
-- Kopfkommentar 0000000000007_fitness_f1_exercise_catalog.sql und
-- scripts/audit-db.md, Bereich 1). Ohne diese Migration ist keine frische
-- Instanz (zweiter Pilot-Haushalt, Staging, Restore) lauffaehig.
--
-- Rekonstruiert per Introspection der Produktiv-DB (Spalten, Constraints,
-- Indizes, Policies, Realtime) am 2026-07-30 — 1:1 Abbild des Ist-Zustands,
-- keine Bereinigung/Vereinheitlichung (z. B. `now()` statt sonst ueblichem
-- `timezone('utc', now())` ist Absicht, nicht Tippfehler).
--
-- `create table if not exists` ist hier ausreichend idempotent: existiert die
-- Tabelle bereits (Prod), ist die ganze Anweisung ein No-Op inkl. aller
-- Inline-Constraints. Auf einer frischen Instanz entstehen Tabelle und
-- Constraints atomar zusammen — Konvention wie in
-- 0000000000007_fitness_f1_exercise_catalog.sql.

-- ── workout_plans ─────────────────────────────────────────────────────────
create table if not exists public.workout_plans (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid not null,
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint workout_plans_workspace_id_fkey foreign key (workspace_id)
    references public.workspaces on delete cascade
);

alter table public.workout_plans enable row level security;

create index if not exists workout_plans_workspace_id_idx
  on public.workout_plans (workspace_id);

do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'workout_plans'
                   and policyname = 'workspace users can manage plans') then
    create policy "workspace users can manage plans" on public.workout_plans
      for all using (
        workspace_id in (
          select workspace_members.workspace_id from public.workspace_members
          where workspace_members.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- ── workout_logs ──────────────────────────────────────────────────────────
create table if not exists public.workout_logs (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid not null,
  user_id uuid not null,
  plan_id uuid not null,
  date date not null,
  duration_minutes integer,
  notes text,
  created_at timestamp with time zone default now(),
  constraint workout_logs_workspace_id_fkey foreign key (workspace_id)
    references public.workspaces on delete cascade,
  constraint workout_logs_user_id_fkey foreign key (user_id)
    references auth.users on delete cascade,
  constraint workout_logs_plan_id_fkey foreign key (plan_id)
    references public.workout_plans on delete cascade
);

alter table public.workout_logs enable row level security;

create index if not exists workout_logs_workspace_id_idx
  on public.workout_logs (workspace_id);

do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'workout_logs'
                   and policyname = 'users see own logs') then
    create policy "users see own logs" on public.workout_logs
      for all using (user_id = auth.uid());
  end if;
end $$;

-- ── workout_exercises ─────────────────────────────────────────────────────
-- exercise_id/exercise_type/default_duration_min/default_distance_km wurden
-- bereits additiv in 0000000000007 ergaenzt — hier nur die Basis-Tabelle.
create table if not exists public.workout_exercises (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid not null,
  name text not null,
  category text,
  default_sets integer not null default 3,
  default_reps integer not null default 10,
  default_weight numeric,
  order_index integer not null default 0,
  exercise_id uuid,
  exercise_type text not null default 'strength',
  default_duration_min numeric,
  default_distance_km numeric,
  constraint workout_exercises_plan_id_fkey foreign key (plan_id)
    references public.workout_plans on delete cascade,
  constraint workout_exercises_exercise_id_fkey foreign key (exercise_id)
    references public.exercise_catalog on delete set null
);

alter table public.workout_exercises enable row level security;

create index if not exists workout_exercises_plan_idx
  on public.workout_exercises (plan_id);

do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'workout_exercises'
                   and policyname = 'workspace users can manage exercises') then
    create policy "workspace users can manage exercises" on public.workout_exercises
      for all using (
        plan_id in (
          select workout_plans.id from public.workout_plans
          where workout_plans.workspace_id in (
            select workspace_members.workspace_id from public.workspace_members
            where workspace_members.user_id = auth.uid()
          )
        )
      );
  end if;
end $$;

-- ── workout_set_logs ──────────────────────────────────────────────────────
-- exercise_id/exercise_type/duration_min/distance_km/rpe: additiv in 0000000000007.
-- set_type: additiv in 0000000000009.
create table if not exists public.workout_set_logs (
  id uuid default gen_random_uuid() primary key,
  log_id uuid not null,
  exercise_name text not null,
  set_index integer not null,
  reps integer,
  weight_kg numeric,
  completed boolean default false,
  exercise_id uuid,
  exercise_type text not null default 'strength',
  duration_min numeric,
  distance_km numeric,
  rpe smallint,
  set_type text not null default 'normal',
  constraint workout_set_logs_log_id_fkey foreign key (log_id)
    references public.workout_logs on delete cascade,
  constraint workout_set_logs_exercise_id_fkey foreign key (exercise_id)
    references public.exercise_catalog on delete set null
);

alter table public.workout_set_logs enable row level security;

create index if not exists workout_set_logs_log_idx
  on public.workout_set_logs (log_id);

do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'workout_set_logs'
                   and policyname = 'users see own set logs') then
    create policy "users see own set logs" on public.workout_set_logs
      for all using (
        log_id in (
          select workout_logs.id from public.workout_logs
          where workout_logs.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- ── life_scores ───────────────────────────────────────────────────────────
create table if not exists public.life_scores (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid not null,
  user_id uuid not null,
  date date not null,
  total smallint not null,
  breakdown jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  constraint life_scores_workspace_id_fkey foreign key (workspace_id)
    references public.workspaces on delete cascade,
  constraint life_scores_user_id_fkey foreign key (user_id)
    references auth.users on delete cascade,
  constraint life_scores_total_check check (total >= 0 and total <= 100),
  constraint life_scores_user_id_date_key unique (user_id, date)
);

alter table public.life_scores enable row level security;

create index if not exists life_scores_workspace_id_idx
  on public.life_scores (workspace_id);

do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'life_scores'
                   and policyname = 'users see own scores') then
    create policy "users see own scores" on public.life_scores
      for all using (user_id = auth.uid());
  end if;
end $$;

-- ── Realtime nachziehen ───────────────────────────────────────────────────
-- 0000000000020 wollte genau das schon erledigen, musste aber ueberspringen
-- ("Tabelle fehlt") — zu dem Zeitpunkt gab es diese fuenf Tabellen in der
-- Migrationshistorie noch nicht. Auf einer frischen Instanz laeuft 20 vor
-- dieser Migration, deshalb hier nachholen, damit Prod-Parität entsteht.
do $$
begin
  alter table public.life_scores replica identity full;
  alter table public.workout_logs replica identity full;
  alter table public.workout_plans replica identity full;
end $$;

do $$
declare
  t text;
  tabellen constant text[] := array[
    'workout_plans', 'workout_logs', 'workout_exercises', 'workout_set_logs',
    'life_scores'
  ];
begin
  foreach t in array tabellen loop
    if not exists (
      select 1 from pg_publication_tables pt
       where pt.pubname = 'supabase_realtime'
         and pt.schemaname = 'public'
         and pt.tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
