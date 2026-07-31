alter table public.calendars add column if not exists ics_last_synced_at timestamptz;
alter table public.events    add column if not exists external_uid text;
create unique index if not exists events_external_uid_idx
  on public.events (calendar_id, external_uid) where external_uid is not null;
