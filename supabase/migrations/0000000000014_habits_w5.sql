-- W5 Gewohnheiten-Ausbau (Streaks-/Habitify-Niveau):
-- Mengen-Routinen (target_value/unit), Skip-Status am Log.
-- Der Wochenziel-Schedule {"type":"weekly_count","times":n} braucht KEINE Migration —
-- habits.schedule ist jsonb, validiert wird per Zod im Frontend.
-- Idempotent (mehrfach ausführbar).

-- 1) habits: Zielwert + Einheit für Mengen-Routinen.
--    target_value IS NULL  -> klassisches Häkchen (Verhalten wie bisher)
--    target_value = n > 1  -> Mengen-Routine, erledigt ab value >= n
alter table habits add column if not exists target_value numeric;
alter table habits add column if not exists unit text;

-- 2) habit_logs: 'done' | 'skipped'. Bestandszeilen sind 'done' (Default).
alter table habit_logs add column if not exists status text not null default 'done';

do $$
begin
  alter table habit_logs
    add constraint habit_logs_status_check check (status in ('done', 'skipped'));
exception when duplicate_object then null;
end $$;

-- 3) value ist ab jetzt der erreichte Wert (Teilfortschritt möglich).
--    Bestandszeilen ohne Wert auf 1 normalisieren, damit die Logik greift.
update habit_logs set value = 1 where value is null;

-- 4) Statistik-Query der Detailseite liest immer (workspace, habit, date).
create index if not exists habit_logs_habit_date_idx
  on habit_logs (workspace_id, habit_id, date desc);

-- RLS: unverändert ("members rw" aus 0000000000003 deckt die neuen Spalten ab).
-- Realtime: habits + habit_logs sind bereits in supabase_realtime (Migration 3).
