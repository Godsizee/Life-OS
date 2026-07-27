-- W9 Stimmung & Gesundheit (Daylio-/Apple-Health-Niveau):
--   1) mood_entries.activities text[] - Daylio-Aktivitaeten-Tags
--   2) mood_entries + health_entries in die Realtime-Publication (fehlten seit
--      Migration 5 - ein zweites Geraet sah Aenderungen nie)
--   3) Indizes fuer Jahres-/Trend-Abfragen
-- Ziele je Metrik (Wasser, Schlaf, Gewicht) leben in profiles.settings (jsonb) -
--   dafuer ist KEINE Migration noetig (Muster: weekly_workout_goal, focus_minutes).
-- Idempotent (mehrfach ausfuehrbar).

-- ── 1) Aktivitaeten-Tags ─────────────────────────────────────────────────────
-- Freies text[] statt Katalog-Tabelle: der Katalog steht im Code
-- (src/lib/features/mood/activities.ts), eigene Tags sind Freitext.
-- Muster: notes.tags (W7).
alter table public.mood_entries
  add column if not exists activities text[] not null default '{}';

-- Defensive Normalisierung: aeltere Zeilen / manuelle Inserts koennen NULL tragen.
update public.mood_entries set activities = '{}' where activities is null;

-- ── 2) Indizes ───────────────────────────────────────────────────────────────
-- Beide Module lesen immer "ein Nutzer, ein Zeitfenster, absteigend".
create index if not exists mood_entries_user_date_idx
  on public.mood_entries (workspace_id, user_id, date desc);

create index if not exists health_entries_user_date_idx
  on public.health_entries (workspace_id, user_id, date desc);

-- ── 3) Realtime ──────────────────────────────────────────────────────────────
-- Migration 5 hat beide Tabellen nie in die Publication aufgenommen.
-- RLS bleibt die Zugriffskontrolle: Policy "mood_owner"/"health_owner" ist
-- user_id = auth.uid(), fremde Zeilen erreichen den Client also nicht.
do $$
begin
  alter publication supabase_realtime add table public.mood_entries;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.health_entries;
exception when duplicate_object then null;
end $$;
