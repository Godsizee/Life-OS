-- W10 Aufgaben — echter Erledigungszeitpunkt und Wochenfokus.
--
-- HINTERGRUND 1 (completed_at): review/+page.svelte, analytics/scoring.ts und
-- timeline/+page.svelte lesen alle updated_at, um "wann wurde das erledigt" zu
-- beantworten. Wer den Titel einer im Maerz erledigten Aufgabe korrigiert,
-- verschiebt sie damit in die laufende Woche und veraendert den heutigen Life Score.
--
-- HINTERGRUND 2 (focus_week): Der Weekly Review laesst drei Aufgaben als
-- Wochenfokus waehlen, schreibt sie aber nur als Markdown ins Tagebuch. Mit
-- focus_week (= Montag der Zielwoche) koennen Dashboard, rankTasks() und die
-- Aufgabenliste sie tatsaechlich bevorzugen.
-- Idempotent (mehrfach ausfuehrbar).

alter table public.tasks add column if not exists completed_at timestamptz;
alter table public.tasks add column if not exists focus_week date;

-- Backfill: erledigte Aufgaben bekommen ihren letzten Aenderungszeitpunkt.
-- Naeherung, aber besser als NULL — und ab jetzt wird der Wert korrekt gefuehrt.
update public.tasks
   set completed_at = updated_at
 where status = 'done'
   and completed_at is null;

create index if not exists tasks_completed_at_idx
  on public.tasks (workspace_id, completed_at desc)
  where completed_at is not null;

create index if not exists tasks_focus_week_idx
  on public.tasks (workspace_id, focus_week)
  where focus_week is not null;

-- assignee_id existiert seit dem Anfang, wurde aber nie befuellt (immer null).
-- Ab W10 ist es editierbar — der Index macht die Filterung "meine Aufgaben" guenstig.
create index if not exists tasks_assignee_idx
  on public.tasks (workspace_id, assignee_id)
  where assignee_id is not null;
