-- Reminder-Reparatur: eine Erinnerung, die laenger als 24 h ueberfaellig war,
-- verstummte danach DAUERHAFT.
-- Idempotent (create or replace).
--
-- URSACHE: claim_due_reminders() filterte mit
--   remind_at <= now() and remind_at > now() - interval '1 day'
-- Der zweite Teil sollte verhindern, dass alte Erinnerungen als Schwall
-- nachgefeuert werden. Er hat die Zeilen aber nicht nur uebersprungen, sondern
-- auch nie WEITERGESCHOBEN: remind_at blieb in der Vergangenheit und fiel damit
-- bei jedem weiteren Lauf erneut durch denselben Filter. Handy zwei Tage aus
-- oder Dispatcher kurz gestanden -> die taegliche Erinnerung war fuer immer tot.
--
-- LOESUNG: Alle faelligen Zeilen werden geclaimt und weitergeschoben. Ob ein
-- Push RAUSGEHT, entscheidet jetzt ein eigenes Flag `should_send`: nur wenn die
-- Faelligkeit nicht aelter als das Nachfeuer-Fenster ist. Der Dispatcher filtert
-- darauf. So bleibt „kein Schwall alter Pushes" erhalten, ohne die Serie zu toeten.

-- Rueckgabetyp aendert sich (setof reminders -> eigene Zeilenform), daher erst weg.
drop function if exists public.claim_due_reminders(integer);

create or replace function public.claim_due_reminders(p_limit integer default 50)
returns table (
  id uuid,
  workspace_id uuid,
  user_id uuid,
  entity_type text,
  entity_id uuid,
  title text,
  body text,
  url text,
  remind_at timestamptz,
  rrule text,
  should_send boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r reminders;
  nxt timestamptz;
  -- Aelter als das -> weiterschieben, aber NICHT mehr pushen.
  catchup constant interval := interval '1 day';
begin
  for r in
    select * from reminders
    where active
      and reminders.remind_at <= now()
    order by reminders.remind_at
    limit greatest(1, least(p_limit, 200))
    for update skip locked
  loop
    nxt := public.next_reminder_occurrence(r.remind_at, r.rrule);

    -- Stand der Dienst laenger: so weit vorspulen, bis der Termin in der
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
        where reminders.id = r.id;
    else
      update reminders
        set remind_at = nxt, last_sent_at = now(), updated_at = now()
        where reminders.id = r.id;
    end if;

    id := r.id;
    workspace_id := r.workspace_id;
    user_id := r.user_id;
    entity_type := r.entity_type;
    entity_id := r.entity_id;
    title := r.title;
    body := r.body;
    url := r.url;
    remind_at := r.remind_at;   -- Stand VOR dem Weiterschieben
    rrule := r.rrule;
    should_send := r.remind_at > now() - catchup;
    return next;
  end loop;
end $$;

revoke execute on function public.claim_due_reminders(integer) from public, anon, authenticated;
