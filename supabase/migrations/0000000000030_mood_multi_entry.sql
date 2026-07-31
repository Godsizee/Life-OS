-- 1) Zeitstempel: Bestandszeilen bekommen 12:00 Uhr ihres Tages.
alter table public.mood_entries add column if not exists logged_at timestamptz;
update public.mood_entries
   set logged_at = (date::timestamp + interval '12 hours') at time zone 'Europe/Berlin'
 where logged_at is null;
alter table public.mood_entries alter column logged_at set not null;

-- 2) Alten Unique-Key ablösen.
alter table public.mood_entries drop constraint if exists mood_entries_workspace_id_user_id_date_key;
create unique index if not exists mood_entries_slot_idx
  on public.mood_entries (workspace_id, user_id, date, logged_at);
