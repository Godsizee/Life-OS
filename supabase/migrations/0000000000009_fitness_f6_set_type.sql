-- Fitness Welle F6: Set-Typen (Warmup/Normal/Dropset/Failure)
-- Idempotent, Konvention wie 0000000000007_fitness_f1_exercise_catalog.sql.
-- Bestehende Sätze werden als 'normal' klassifiziert; Warmup-Sätze werden
-- clientseitig aus Volumen-/1RM-Statistik gefiltert.

alter table workout_set_logs add column if not exists set_type text not null default 'normal';
