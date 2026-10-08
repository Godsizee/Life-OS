-- Aufgaben-Status „verworfen“.
--
-- HINTERGRUND: Im Tagesabschluss (LOS27 T405) ist „Verwerfen“ eine legitime
-- Entscheidung. Bisher blieb nur Löschen (Historie weg) oder ewig offen lassen
-- (taucht als überfällig auf). 'dropped' hält die Aufgabe als bewusst
-- losgelassen fest — zählt weder als offen noch als erledigt.
--
-- ACHTUNG: Ein neuer Enum-Wert ist erst nach dem COMMIT nutzbar. Diese Datei
-- deshalb EINZELN ausführen und den Wert hier NICHT verwenden.
-- Idempotent (if not exists).

alter type public.task_status add value if not exists 'dropped';
