-- W8 Ziele & Tagebuch (Strides-/Day-One-Niveau):
--   1) goals: Zielwert-Typ 'target' + Einheit, Typ-Constraint
--   2) goal_checkins: Check-in-Verlauf (Datum, Wert, Notiz) - geteilt wie goals
--   3) journal_entries: kind ('daily' | 'weekly'), Unique-Key auf (user, date, kind)
--   4) attachments-RLS um den journal-Zweig ergaenzen (setzt W7 voraus)
-- Idempotent (mehrfach ausfuehrbar).

-- ── 1) goals: Zielwert-Ziele ─────────────────────────────────────────────────
-- target_value existiert seit 0000000000006 (PR-Ziele) und wird fuer 'target'
-- als Zielmenge wiederverwendet. Neu ist nur die Einheit.
alter table public.goals add column if not exists target_unit text;

-- goal_type war freies text. Erst Altbestand normalisieren, dann Constraint setzen.
update public.goals set goal_type = 'standard'
 where goal_type is null
    or goal_type not in ('standard', 'pr', 'fitness_frequency', 'target');

do $$
begin
  alter table public.goals
    add constraint goals_goal_type_check
    check (goal_type in ('standard', 'pr', 'fitness_frequency', 'target'));
exception when duplicate_object then null;
end $$;

-- Liste + Detail lesen immer (workspace, parent).
create index if not exists goals_workspace_parent_idx
  on public.goals (workspace_id, parent_id);

-- ── 2) goal_checkins ─────────────────────────────────────────────────────────
-- Additive Check-ins: der Fortschritt eines 'target'-Ziels ist die Summe aller
-- Werte. Kein Unique-Key - mehrere Check-ins pro Tag sind erlaubt.
create table if not exists public.goal_checkins (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces on delete cascade not null,
  goal_id uuid references public.goals on delete cascade not null,
  user_id uuid references auth.users not null,
  date date not null,
  value numeric not null default 0,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.goal_checkins enable row level security;

create index if not exists goal_checkins_goal_date_idx
  on public.goal_checkins (workspace_id, goal_id, date desc);

-- Ziele sind geteilt -> Check-ins ebenfalls (Paar sieht denselben Fortschritt).
do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'goal_checkins'
                   and policyname = 'members rw') then
    create policy "members rw" on public.goal_checkins
      using (public.is_member(workspace_id))
      with check (public.is_member(workspace_id));
  end if;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.goal_checkins;
exception when duplicate_object then null;
end $$;

-- ── 3) journal_entries: Tages- vs. Wochen-Eintrag ────────────────────────────
alter table public.journal_entries add column if not exists kind text not null default 'daily';

update public.journal_entries set kind = 'daily'
 where kind is null or kind not in ('daily', 'weekly');

do $$
begin
  alter table public.journal_entries
    add constraint journal_entries_kind_check check (kind in ('daily', 'weekly'));
exception when duplicate_object then null;
end $$;

-- Alter Unique-Key (user_id, date) -> (user_id, date, kind).
-- Der Constraint aus Migration 3 heisst journal_entries_user_id_date_key.
alter table public.journal_entries
  drop constraint if exists journal_entries_user_id_date_key;

do $$
begin
  alter table public.journal_entries
    add constraint journal_entries_user_date_kind_key unique (user_id, date, kind);
exception when duplicate_object or duplicate_table then null;
end $$;

create index if not exists journal_entries_user_date_idx
  on public.journal_entries (workspace_id, user_id, date desc);

-- ── 4) attachments-RLS: journal-Zweig (setzt W7 voraus) ──────────────────────
-- Ein Journal-Eintrag ist persoenlich. Ohne diesen Zweig koennte ein Partner die
-- attachments-Zeilen fremder Eintraege lesen und signierte URLs ziehen.
-- Der EXISTS-Test laeuft selbst unter RLS: journal_entries ist owner-only, der
-- Test ist fuer alle ausser dem Autor false.
do $$
begin
  if to_regclass('public.attachments') is not null then
    drop policy if exists "attachments read" on public.attachments;
    create policy "attachments read" on public.attachments for select
      using (
        public.is_member(workspace_id)
        and (entity_type <> 'note'
             or exists (select 1 from public.notes n where n.id = attachments.entity_id))
        and (entity_type <> 'journal'
             or exists (select 1 from public.journal_entries j
                         where j.id = attachments.entity_id))
      );

    drop policy if exists "attachments delete" on public.attachments;
    create policy "attachments delete" on public.attachments for delete
      using (
        public.is_member(workspace_id)
        and (entity_type <> 'note'
             or exists (select 1 from public.notes n where n.id = attachments.entity_id))
        and (entity_type <> 'journal'
             or exists (select 1 from public.journal_entries j
                         where j.id = attachments.entity_id))
      );
  else
    raise notice 'Tabelle attachments fehlt (W7 nicht ausgefuehrt) - Abschnitt 4 uebersprungen.';
  end if;
end $$;

-- attachments insert bleibt unveraendert (is_member + created_by = auth.uid()).
-- Storage-Policies bleiben unveraendert: sie spiegeln die attachments-Zeile und
-- erben damit automatisch die neue Journal-Bedingung.
