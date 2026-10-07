-- Herkunft automatisch angelegter Einträge.
--
-- HINTERGRUND: Regeln (LOS27 T205) haken Routinen ab und tragen Ziel-Check-ins
-- ein. Damit Life OS auf JEDEM Gerät erklären kann, warum ein Eintrag existiert
-- (Sticker AUTO + Regelname), steht die Herkunft am Datensatz selbst:
-- 'manual' oder 'automation:<regelId>'.
--
-- Der Default greift nur beim INSERT. Der Client setzt source bei JEDEM
-- Schreibweg ausdrücklich (Upsert!), sonst bliebe nach manueller Änderung
-- 'automation:…' stehen.
-- Idempotent (mehrfach ausfuehrbar).

alter table public.habit_logs    add column if not exists source text not null default 'manual';
alter table public.goal_checkins add column if not exists source text not null default 'manual';

do $$
begin
  alter table public.habit_logs
    add constraint habit_logs_source_check
    check (source = 'manual' or source like 'automation:%') not valid;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.goal_checkins
    add constraint goal_checkins_source_check
    check (source = 'manual' or source like 'automation:%') not valid;
exception when duplicate_object then null;
end $$;
