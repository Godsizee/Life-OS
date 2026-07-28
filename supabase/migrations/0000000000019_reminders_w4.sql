-- W4 Reminder-Infra (Querschnitt): generische Erinnerungen + serverseitiger Dispatch.
-- Idempotent (mehrfach ausführbar).
-- Versand: Edge Function `lifeos-reminder-dispatch` ruft claim_due_reminders()
-- mit dem service_role-Key auf (RLS-frei, security definer).

-- 1) Tabelle -----------------------------------------------------------------
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces on delete cascade not null,
  -- Empfaenger des Pushes. Sichtbarkeit regelt workspace_id (RLS), Zustellung user_id.
  user_id uuid references auth.users on delete cascade not null,
  -- 'task' | 'event' | 'habit' | 'goal' | 'health' | 'custom'  (Union in types.ts,
  -- bewusst ohne DB-Check: neue Module sollen keine Migration brauchen).
  entity_type text not null,
  entity_id uuid,                       -- null bei entity_type = 'custom'
  -- Eingefrorener Push-Inhalt: der Dispatcher joint keine Fremdtabellen.
  title text not null,
  body text,
  url text not null default '/',        -- Deep-Link fuer notificationclick
  remind_at timestamptz not null,       -- naechster Faelligkeitszeitpunkt (UTC)
  rrule text,                           -- null = einmalig; sonst FREQ=DAILY|WEEKLY|MONTHLY
  offset_minutes integer not null default 0,  -- Minuten VOR der Ankerzeit (Termine)
  active boolean not null default true,
  last_sent_at timestamptz,
  created_by uuid references auth.users not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists reminders_due_idx on reminders (remind_at) where active;
create index if not exists reminders_entity_idx
  on reminders (workspace_id, entity_type, entity_id);

alter table reminders enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'reminders' and policyname = 'members rw'
  ) then
    create policy "members rw" on reminders
      using (is_member(workspace_id)) with check (is_member(workspace_id));
  end if;
end $$;

do $$
begin
  alter publication supabase_realtime add table reminders;
exception when duplicate_object then null;
end $$;

-- 2) Naechste Ausprägung ------------------------------------------------------
-- Rechnet in ORTSZEIT (Europe/Berlin), damit "taeglich 07:30" ueber die
-- Zeitumstellung 07:30 bleibt. Unterstuetzt FREQ=DAILY|WEEKLY|MONTHLY,
-- optional INTERVAL=n und (nur WEEKLY) BYDAY=MO,TU,...
create or replace function public.next_reminder_occurrence(
  p_from timestamptz,
  p_rrule text
) returns timestamptz
language plpgsql
stable
set search_path = public
as $$
declare
  tz constant text := 'Europe/Berlin';
  codes constant text[] := array['MO','TU','WE','TH','FR','SA','SU']; -- Index = isodow
  body text;
  freq text;
  ival integer;
  byday text[];
  local_ts timestamp;
  cand timestamp;
  i integer;
begin
  if p_rrule is null or btrim(p_rrule) = '' then
    return null;
  end if;

  body := replace(upper(btrim(p_rrule)), 'RRULE:', '');
  freq := substring(body from 'FREQ=([A-Z]+)');
  ival := greatest(1, coalesce(nullif(substring(body from 'INTERVAL=([0-9]+)'), '')::int, 1));
  byday := string_to_array(coalesce(substring(body from 'BYDAY=([A-Z,]+)'), ''), ',');

  local_ts := p_from at time zone tz;

  if freq = 'DAILY' then
    cand := local_ts + (ival || ' days')::interval;

  elsif freq = 'WEEKLY' and coalesce(array_length(byday, 1), 0) > 0 and byday[1] <> '' then
    cand := null;
    for i in 1..7 loop
      if codes[extract(isodow from (local_ts + (i || ' days')::interval))::int] = any (byday) then
        cand := local_ts + (i || ' days')::interval;
        exit;
      end if;
    end loop;
    if cand is null then
      cand := local_ts + (7 * ival || ' days')::interval;
    end if;

  elsif freq = 'WEEKLY' then
    cand := local_ts + (7 * ival || ' days')::interval;

  elsif freq = 'MONTHLY' then
    cand := local_ts + (ival || ' months')::interval;

  else
    return null;   -- unbekannte Regel -> Reminder wird wie einmalig behandelt
  end if;

  return cand at time zone tz;
end $$;

-- 3) Claim-then-send ----------------------------------------------------------
-- Gibt faellige Reminder zurueck und schiebt sie in derselben Transaktion weiter.
-- Zwei parallele Laeufe koennen dieselbe Zeile dadurch nicht doppelt versenden.
create or replace function public.claim_due_reminders(p_limit integer default 50)
returns setof reminders
language plpgsql
security definer
set search_path = public
as $$
declare
  r reminders;
  nxt timestamptz;
begin
  for r in
    select * from reminders
    where active
      and remind_at <= now()
      and remind_at > now() - interval '1 day'   -- nichts aelter als 24h nachfeuern
    order by remind_at
    limit greatest(1, least(p_limit, 200))
    for update skip locked
  loop
    nxt := public.next_reminder_occurrence(r.remind_at, r.rrule);

    -- Falls der Dienst laenger stand: so weit vorspulen, bis der Termin in der
    -- Zukunft liegt (max. 400 Schritte als Sicherheitskappe).
    if nxt is not null then
      for i in 1..400 loop
        exit when nxt > now();
        nxt := public.next_reminder_occurrence(nxt, r.rrule);
        exit when nxt is null;
      end loop;
    end if;

    if nxt is null then
      update reminders
        set active = false, last_sent_at = now(), updated_at = now()
        where id = r.id;
    else
      update reminders
        set remind_at = nxt, last_sent_at = now(), updated_at = now()
        where id = r.id;
    end if;

    return next r;   -- zurueckgegeben wird der Stand VOR dem Weiterschieben
  end loop;
end $$;

revoke execute on function public.claim_due_reminders(integer) from public, anon, authenticated;

-- 4) Waisen aufraeumen --------------------------------------------------------
-- Entitaet geloescht (z. B. offline, ohne dass der Client aufraeumen konnte)
-- -> zugehoerige Reminder entfernen. Wird vom selben Auslöser 1x taeglich gerufen.
create or replace function public.cleanup_orphan_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  with del as (
    delete from reminders r
    where r.entity_id is not null
      and (
        (r.entity_type = 'task'  and not exists (select 1 from tasks  t where t.id = r.entity_id)) or
        (r.entity_type = 'event' and not exists (select 1 from events e where e.id = r.entity_id)) or
        (r.entity_type = 'habit' and not exists (select 1 from habits h where h.id = r.entity_id)) or
        (r.entity_type = 'goal'  and not exists (select 1 from goals  g where g.id = r.entity_id))
      )
    returning 1
  )
  select count(*) into removed from del;
  return removed;
end $$;

revoke execute on function public.cleanup_orphan_reminders() from public, anon, authenticated;
