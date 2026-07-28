-- Realtime-Reparatur (Querschnitt): DELETE-Events kamen bei keinem Modul an.
-- Idempotent (mehrfach ausfuehrbar).
--
-- URSACHE: subscribeToTable() (src/lib/core/realtime.ts) filtert mit
-- `workspace_id=eq.<id>`. Bei DELETE schreibt Postgres mit der Default-Einstellung
-- `replica identity default` nur die Primaerschluessel-Spalten ins WAL — die
-- alte Zeile enthaelt also kein workspace_id, der Filter verwirft das Event.
-- Damit war der onDelete-Handler in JEDEM Store toter Code: geloeschte Zeilen
-- blieben auf dem Zweitgeraet bis zum Reload sichtbar.
--
-- `replica identity full` legt die komplette alte Zeile ins WAL. Kosten: etwas
-- mehr WAL-Volumen pro UPDATE/DELETE — bei diesen Zeilengroessen unkritisch.

do $$
declare
  t text;
  -- Alle Tabellen, die ein Store abonniert (subscribeToTable-Aufrufe),
  -- plus die beiden nachgezogenen Abos (projects, exercise_catalog).
  tabellen constant text[] := array[
    'attachments', 'entity_links', 'event_overrides', 'events',
    'exercise_catalog', 'goal_checkins', 'goals', 'habit_logs', 'habits',
    'health_entries', 'journal_entries', 'life_scores', 'mood_entries',
    'notes', 'projects', 'reminders', 'shopping_items', 'tasks',
    'time_entries', 'workout_logs', 'workout_plans', 'workspace_settings'
  ];
begin
  foreach t in array tabellen loop
    -- Tabellen, die es (noch) nicht gibt, ueberspringen: life_scores und die
    -- workout_*-Tabellen sind nie als `create table` erfasst worden.
    if exists (
      select 1 from pg_class c
       where c.relname = t
         and c.relnamespace = 'public'::regnamespace
         and c.relkind = 'r'
    ) then
      execute format('alter table public.%I replica identity full', t);
    else
      raise notice 'uebersprungen (Tabelle fehlt): %', t;
    end if;
  end loop;
end $$;


-- ── Fehlende Publications nachziehen ────────────────────────────────────────
-- workout_plans / workout_logs werden vom Fitness-Store abonniert, wurden aber
-- nie publiziert. life_scores ebenso (Analytics-Store).
do $$
declare
  t text;
  tabellen constant text[] := array[
    'workout_plans', 'workout_logs', 'workout_exercises', 'workout_set_logs',
    'life_scores'
  ];
begin
  foreach t in array tabellen loop
    if exists (
      select 1 from pg_class c
       where c.relname = t
         and c.relnamespace = 'public'::regnamespace
         and c.relkind = 'r'
    ) and not exists (
      select 1 from pg_publication_tables pt
       where pt.pubname = 'supabase_realtime'
         and pt.schemaname = 'public'
         and pt.tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
