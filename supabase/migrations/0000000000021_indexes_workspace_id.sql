-- Index-Nachzug (Querschnitt): jede Feature-Query filtert auf workspace_id,
-- zusaetzlich prueft die RLS-Policy `is_member(workspace_id)` pro Zeile.
-- Ohne fuehrenden Index laeuft beides als Seq Scan.
-- Idempotent (mehrfach ausfuehrbar).
--
-- Bewusst datengetrieben statt einer festen Tabellenliste: so bekommen auch die
-- Tabellen einen Index, die nie als `create table` in dieser Historie erfasst
-- wurden (workout_*, life_scores — siehe Migration 7, Kopfkommentar).
--
-- Uebersprungen wird, wo workspace_id bereits FUEHRENDE Spalte eines Index ist
-- (z. B. workspace_settings via Primaerschluessel). Ein Index auf
-- (user_id, date) zaehlt nicht — er hilft einem workspace_id-Filter nicht.

do $$
declare
  r record;
begin
  for r in
    select c.oid, c.relname
      from pg_class c
      join pg_attribute a
        on a.attrelid = c.oid
       and a.attname = 'workspace_id'
       and a.attnum > 0
       and not a.attisdropped
     where c.relnamespace = 'public'::regnamespace
       and c.relkind = 'r'
  loop
    if not exists (
      select 1
        from pg_index i
        join pg_attribute ia
          on ia.attrelid = r.oid
         and ia.attnum = i.indkey[0]
       where i.indrelid = r.oid
         and ia.attname = 'workspace_id'
    ) then
      execute format(
        'create index if not exists %I on public.%I (workspace_id)',
        r.relname || '_workspace_id_idx', r.relname
      );
      raise notice 'Index angelegt: %_workspace_id_idx', r.relname;
    end if;
  end loop;
end $$;

-- Ergaenzend: die beiden Kind-Tabellen des Fitness-Moduls werden ueber ihren
-- Parent gelesen (listExercises(planId), listSetLogs(logId)), nicht ueber
-- workspace_id. Dafuer braucht es eigene Indizes.
do $$
begin
  if to_regclass('public.workout_exercises') is not null then
    create index if not exists workout_exercises_plan_idx
      on public.workout_exercises (plan_id);
  end if;
  if to_regclass('public.workout_set_logs') is not null then
    create index if not exists workout_set_logs_log_idx
      on public.workout_set_logs (log_id);
  end if;
end $$;
