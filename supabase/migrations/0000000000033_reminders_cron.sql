-- Auslöser für den Reminder-Dispatch.
--
-- HINTERGRUND: Die Edge Function `lifeos-reminder-dispatch` und
-- `claim_due_reminders()` (Migration 23) sind fertig — aber niemand rief sie
-- auf. Ohne Scheduler feuert KEINE Erinnerung, das gesamte Modul war inaktiv.
--
-- Alle 5 Minuten: feiner als die Auflösung, mit der Erinnerungen gesetzt werden,
-- und grob genug, dass die Function nicht dauernd kalt startet.
--
-- MANUELL VOR DEM ANWENDEN (siehe docs/LifeOS_Deployment.md):
--   1. Function deployen:  supabase functions deploy lifeos-reminder-dispatch
--   2. Beide Werte in der Vault hinterlegen — sie stehen bewusst NICHT in dieser
--      Datei, damit kein Secret im Repo landet:
--        select vault.create_secret('https://<projekt>.supabase.co', 'lifeos_functions_url');
--        select vault.create_secret('<LIFEOS_INTAKE_TOKEN>',         'lifeos_intake_token');

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Wiederholtes Anwenden darf keinen zweiten Job anlegen: unschedule wirft, wenn
-- der Job fehlt, deshalb über den Katalog statt über den Namen.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'lifeos-reminder-dispatch') then
    perform cron.unschedule('lifeos-reminder-dispatch');
  end if;
end $$;

select cron.schedule(
  'lifeos-reminder-dispatch',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets
                 where name = 'lifeos_functions_url')
               || '/functions/v1/lifeos-reminder-dispatch',
    headers := jsonb_build_object(
                 'content-type',    'application/json',
                 'x-lifeos-token',  (select decrypted_secret from vault.decrypted_secrets
                                      where name = 'lifeos_intake_token')
               ),
    -- cleanup: tote Push-Endpoints (404/410) mit aufräumen, sonst wächst
    -- push_subscriptions mit jedem deinstallierten Gerät weiter.
    body    := jsonb_build_object('limit', 50, 'cleanup', true),
    timeout_milliseconds := 20000
  );
  $cron$
);
