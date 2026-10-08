-- Planung (geplant / Schätzung / Zeitblock) und Tagesrituale.
--
-- HINTERGRUND 1: due_at war Absicht UND Frist zugleich. „Heute erledigen wollen“
-- und „bis Freitag erledigt sein müssen“ sind verschiedene Dinge; vermischt
-- erzeugen sie Schein-Überfälligkeit. planned_for trägt die Absicht,
-- due_at bleibt die Frist. estimate_min speist die Kapazität im Tagesplan,
-- scheduled_start den optionalen Zeitblock.
--
-- HINTERGRUND 2: day_rituals hält je Person und Tag fest, ob der Tag geplant
-- und abgeschlossen wurde (LOS27 T404/T405). Persönlich wie journal_entries.
-- Idempotent (mehrfach ausfuehrbar).

alter table public.tasks add column if not exists planned_for date;
alter table public.tasks add column if not exists estimate_min integer;
alter table public.tasks add column if not exists scheduled_start timestamptz;

do $$
begin
  alter table public.tasks
    add constraint tasks_estimate_min_range
    check (estimate_min is null or estimate_min between 1 and 1440) not valid;
exception when duplicate_object then null;
end $$;

create index if not exists tasks_planned_for_idx
  on public.tasks (workspace_id, planned_for) where planned_for is not null;
create index if not exists tasks_scheduled_start_idx
  on public.tasks (workspace_id, scheduled_start) where scheduled_start is not null;

create table if not exists public.day_rituals (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid not null references public.workspaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  planned_at timestamptz,
  closed_at timestamptz,
  capacity_min integer check (capacity_min is null or capacity_min between 0 and 1440),
  intention text check (intention is null or char_length(intention) <= 280),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (user_id, date)
);

alter table public.day_rituals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'day_rituals' and policyname = 'owner rw'
  ) then
    create policy "owner rw" on public.day_rituals
      using (user_id = auth.uid() and public.is_member(workspace_id))
      with check (user_id = auth.uid() and public.is_member(workspace_id));
  end if;
end $$;

create index if not exists day_rituals_user_date_idx on public.day_rituals (user_id, date desc);
create index if not exists day_rituals_workspace_idx on public.day_rituals (workspace_id);

-- Ohne replica identity full kommt DELETE per Realtime nie an (Migration 20).
alter table public.day_rituals replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.day_rituals;
exception when duplicate_object then null;
end $$;
