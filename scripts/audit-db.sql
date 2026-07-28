-- Life OS — Read-only Audit der Produktiv-Datenbank.
--
-- Ausfuehren im Supabase SQL-Editor (Dashboard -> SQL Editor -> New query).
-- Das Skript schreibt NICHTS und liefert bewusst EIN EINZIGES Ergebnis: der
-- SQL-Editor zeigt sonst nur die letzte Anweisung an.
--
-- Es beantwortet vier Fragen, die sich aus dem Repository allein nicht klaeren
-- lassen. Einordnung jeder Zeile: scripts/audit-db.md
--
-- Zeilen mit status = 'PROBLEM' stehen oben. Ist die Liste leer bis zum ersten
-- 'ok', ist alles in Ordnung.

with
-- Vom Client benutzte Tabellen (alle .from('…')-Aufrufe in src/).
erwartet(tabelle) as (
  values
    ('attachments'), ('calendars'), ('entity_links'), ('event_overrides'),
    ('events'), ('exercise_catalog'), ('goal_checkins'), ('goals'),
    ('habit_logs'), ('habits'), ('health_entries'), ('invites'),
    ('journal_entries'), ('life_scores'), ('mood_entries'), ('notes'),
    ('personal_records'), ('profiles'), ('projects'), ('push_subscriptions'),
    ('reminders'), ('shopping_items'), ('tasks'), ('time_entries'),
    ('workout_exercises'), ('workout_logs'), ('workout_plans'),
    ('workout_set_logs'), ('workspace_members'), ('workspace_settings'),
    ('workspaces')
),
-- Tabellen, die ein Store per subscribeToTable() abonniert.
abonniert(tabelle) as (
  values
    ('attachments'), ('entity_links'), ('event_overrides'), ('events'),
    ('exercise_catalog'), ('goal_checkins'), ('goals'), ('habit_logs'),
    ('habits'), ('health_entries'), ('journal_entries'), ('life_scores'),
    ('mood_entries'), ('notes'), ('projects'), ('reminders'),
    ('shopping_items'), ('tasks'), ('time_entries'), ('workout_logs'),
    ('workout_plans'), ('workspace_settings')
),

-- ═══ 1) Existenz + RLS + Policy-Anzahl ═══════════════════════════════════
rls as (
  select
    '1 Tabellen & RLS'::text as bereich,
    e.tabelle::text          as objekt,
    case
      when c.oid is null                then 'PROBLEM'
      when not c.relrowsecurity         then 'PROBLEM'
      when not exists (select 1 from pg_policies p
                        where p.schemaname = 'public' and p.tablename = e.tabelle)
                                        then 'PROBLEM'
      else 'ok'
    end::text as status,
    case
      when c.oid is null        then 'Tabelle FEHLT — Modul nicht lauffaehig'
      when not c.relrowsecurity then 'RLS AUS — jeder eingeloggte Nutzer liest alle Workspaces'
      when not exists (select 1 from pg_policies p
                        where p.schemaname = 'public' and p.tablename = e.tabelle)
        then 'RLS an, aber KEINE Policy — Tabelle liefert immer leer'
      else 'RLS aktiv, ' || (select count(*) from pg_policies p
                              where p.schemaname = 'public' and p.tablename = e.tabelle)::text
                         || ' Policy/Policies'
    end::text as befund
  from erwartet e
  left join pg_class c
         on c.relname = e.tabelle
        and c.relnamespace = 'public'::regnamespace
        and c.relkind = 'r'
),

-- ═══ 2) Realtime: Publication + replica identity ═════════════════════════
realtime as (
  select
    '2 Realtime'::text as bereich,
    a.tabelle::text    as objekt,
    case
      when c.oid is null then 'PROBLEM'
      when not exists (select 1 from pg_publication_tables pt
                        where pt.pubname = 'supabase_realtime'
                          and pt.schemaname = 'public' and pt.tablename = a.tabelle)
                              then 'PROBLEM'
      when c.relreplident <> 'f' then 'PROBLEM'
      else 'ok'
    end::text as status,
    case
      when c.oid is null then 'Tabelle fehlt'
      when not exists (select 1 from pg_publication_tables pt
                        where pt.pubname = 'supabase_realtime'
                          and pt.schemaname = 'public' and pt.tablename = a.tabelle)
        then 'NICHT publiziert — der Store abonniert ins Leere'
      when c.relreplident <> 'f'
        then 'replica identity = ' || c.relreplident::text || ' — DELETE-Events kommen nicht an'
      else 'publiziert + replica identity full'
    end::text as befund
  from abonniert a
  left join pg_class c
         on c.relname = a.tabelle
        and c.relnamespace = 'public'::regnamespace
        and c.relkind = 'r'
),

-- Publiziert, aber vom Client nicht abonniert: kostet WAL-Bandbreite.
ueberfluessig as (
  select
    '2 Realtime'::text                              as bereich,
    pt.tablename::text                              as objekt,
    'hinweis'::text                                 as status,
    'publiziert, aber kein Store abonniert das'::text as befund
  from pg_publication_tables pt
  where pt.pubname = 'supabase_realtime'
    and pt.schemaname = 'public'
    and pt.tablename not in (select tabelle from abonniert)
),

-- ═══ 3) Zeilenanzahl gegen das PostgREST-Limit ═══════════════════════════
-- query_to_xml zaehlt exakt und dynamisch — kein Fehler, wenn eine Tabelle
-- fehlt, weil nur ueber vorhandene pg_class-Eintraege iteriert wird.
zeilen as (
  select
    c.relname::text as tabelle,
    (xpath(
      '/row/cnt/text()',
      query_to_xml(format('select count(*) as cnt from public.%I', c.relname), false, true, '')
    ))[1]::text::bigint as anzahl
  from pg_class c
  where c.relnamespace = 'public'::regnamespace
    and c.relkind = 'r'
    and c.relname in (select tabelle from erwartet)
),
mengen as (
  select
    '3 Zeilen vs. 1000er-Limit'::text as bereich,
    z.tabelle                         as objekt,
    case when z.anzahl >= 900 then 'PROBLEM' else 'ok' end::text as status,
    (z.anzahl::text || ' Zeilen' ||
      case
        when z.anzahl >= 1000 then ' — GEKAPPT, der Client sah nur die ersten 1000'
        when z.anzahl >= 900  then ' — kurz vor der Kappung'
        else ''
      end)::text as befund
  from zeilen z
),

-- ═══ 4) Index-Abdeckung ══════════════════════════════════════════════════
indizes as (
  select
    '4 Indizes'::text as bereich,
    c.relname::text   as objekt,
    case when treffer then 'ok' else 'PROBLEM' end::text as status,
    case when treffer
         then 'workspace_id ist fuehrende Index-Spalte'
         else 'KEIN Index mit workspace_id vorn — Seq Scan bei jeder Query'
    end::text as befund
  from (
    select c.oid, c.relname,
      exists (
        select 1 from pg_index i
        join pg_attribute ia
          on ia.attrelid = c.oid and ia.attnum = i.indkey[0]
        where i.indrelid = c.oid and ia.attname = 'workspace_id'
      ) as treffer
    from pg_class c
    join pg_attribute wa
      on wa.attrelid = c.oid and wa.attname = 'workspace_id'
     and wa.attnum > 0 and not wa.attisdropped
    where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
  ) c
),

-- Die beiden Fitness-Kindtabellen haengen an plan_id/log_id, nicht an workspace_id.
kind_indizes as (
  select
    '4 Indizes'::text as bereich,
    (t.tabelle || ' (' || t.spalte || ')')::text as objekt,
    case when exists (
      select 1 from pg_index i
      join pg_attribute ia on ia.attrelid = i.indrelid and ia.attnum = i.indkey[0]
      where i.indrelid = to_regclass('public.' || t.tabelle) and ia.attname = t.spalte
    ) then 'ok' else 'PROBLEM' end::text as status,
    'Kindtabelle wird ueber den Parent gelesen'::text as befund
  from (values ('workout_exercises'::text, 'plan_id'::text),
               ('workout_set_logs'::text,  'log_id'::text)) as t(tabelle, spalte)
  where to_regclass('public.' || t.tabelle) is not null
)

select bereich, objekt, status, befund
from (
  select * from rls
  union all select * from realtime
  union all select * from ueberfluessig
  union all select * from mengen
  union all select * from indizes
  union all select * from kind_indizes
) alles
order by
  case status when 'PROBLEM' then 0 when 'hinweis' then 1 else 2 end,
  bereich,
  objekt;
