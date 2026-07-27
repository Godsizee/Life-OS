-- W6 Fokus & Zeit (Forest-/Toggl-Niveau):
-- time_entries existiert seit 0000000000006_wave5_integration.sql, ist bereits in
-- supabase_realtime und hat die Policy "owner and member" (persoenlich, nicht geteilt).
-- W6 ergaenzt: Notiz am Eintrag, harter Quellen-Constraint, Lese-Indizes.
-- Idempotent (mehrfach ausfuehrbar).

-- 1) Freitext fuer manuelle Nachtraege ohne Aufgabe ("Telefonat Kunde", "Deep Work").
alter table time_entries add column if not exists note text;

-- 2) source war freies text mit default 'manual'. Das Frontend kennt genau zwei Werte.
--    Erst Altbestand normalisieren, dann den Constraint setzen.
update time_entries set source = 'manual' where source not in ('pomodoro', 'manual');

do $$
begin
  alter table time_entries
    add constraint time_entries_source_check check (source in ('pomodoro', 'manual'));
exception when duplicate_object then null;
end $$;

-- 3) Alle W6-Auswertungen lesen (workspace, user, Zeitfenster) — Tagessumme,
--    Wochensumme, 7-Tage-Verlauf.
create index if not exists time_entries_user_started_idx
  on time_entries (workspace_id, user_id, started_at desc);

-- 4) "Zeit an dieser Aufgabe" im TaskDetailSheet.
create index if not exists time_entries_task_idx
  on time_entries (task_id) where task_id is not null;

-- RLS: unveraendert ("owner and member" aus 0000000000006 deckt die neue Spalte ab).
-- Realtime: time_entries ist bereits in supabase_realtime (Migration 6).
