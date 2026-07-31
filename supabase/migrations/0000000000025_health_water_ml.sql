-- W10 Gesundheit — Wasser kanonisch in Millilitern.
--
-- HINTERGRUND: water_glasses zählt Gläser ohne definierte Größe. Zwei Nutzer (und
-- derselbe Nutzer an zwei Tagen) meinen damit unterschiedliche Mengen. Die Anzeige
-- soll weiterhin wahlweise in Gläsern erfolgen (profiles.settings.water_unit) —
-- gespeichert wird aber ml, damit eine spätere Änderung der Glasgröße die Historie
-- NICHT rückwirkend verfälscht.
--
-- water_glasses bleibt bewusst stehen: Rückfall für Altzeilen und für den Fall,
-- dass der Frontend-Rollout zurückgenommen werden muss.
-- Idempotent (mehrfach ausfuehrbar).

alter table public.health_entries
  add column if not exists water_ml integer;

-- Backfill mit 250 ml je Glas. DIESE ZAHL MUSS ZUM Rückfall in
-- src/lib/features/health/stats.ts:waterMl() (LEGACY_GLASS_ML) PASSEN.
update public.health_entries
   set water_ml = water_glasses * 250
 where water_ml is null
   and water_glasses is not null;

-- 15 l/Tag ist das physiologische Maximum; darüber liegt sicher ein Tippfehler.
-- `not valid`, damit die Migration nicht an eventuellen Altzeilen scheitert.
do $$
begin
  alter table public.health_entries
    add constraint health_entries_water_ml_range
    check (water_ml is null or (water_ml >= 0 and water_ml <= 15000)) not valid;
exception when duplicate_object then null;
end $$;
