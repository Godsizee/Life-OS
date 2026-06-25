-- M2: Gewohnheiten, Kalender, Einkauf, Ziele & Tagebuch + RLS + Realtime

create type goal_status as enum ('open', 'in_progress', 'done');

create table habits (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  name text not null,
  schedule jsonb default '{"type":"daily"}'::jsonb not null,
  color text,
  archived boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table habit_logs (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  habit_id uuid references habits on delete cascade not null,
  user_id uuid references auth.users not null,
  date date not null,
  value numeric default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (habit_id, user_id, date)
);

create table calendars (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  name text not null,
  color text,
  ics_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table events (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  calendar_id uuid references calendars on delete cascade not null,
  title text not null,
  start timestamp with time zone not null,
  "end" timestamp with time zone not null,
  all_day boolean default false not null,
  location text,
  rrule text,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table shopping_items (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  name text not null,
  qty numeric default 1,
  unit text,
  checked boolean default false not null,
  position integer default 0,
  added_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table goals (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  parent_id uuid references goals on delete set null,
  title text not null,
  description text default '',
  target_date date,
  progress integer default 0 not null check (progress between 0 and 100),
  status goal_status default 'open' not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table journal_entries (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  user_id uuid references auth.users not null,
  date date not null,
  mood text,
  body text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, date)
);

alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table calendars enable row level security;
alter table events enable row level security;
alter table shopping_items enable row level security;
alter table goals enable row level security;
alter table journal_entries enable row level security;

create policy "members rw" on habits
  using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy "members rw" on habit_logs
  using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy "members rw" on calendars
  using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy "members rw" on events
  using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy "members rw" on shopping_items
  using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy "members rw" on goals
  using (is_member(workspace_id)) with check (is_member(workspace_id));

-- Tagebuch ist persoenlich: Mitgliedschaft UND Autorenschaft.
create policy "owner and member" on journal_entries
  using (user_id = auth.uid() and is_member(workspace_id))
  with check (user_id = auth.uid() and is_member(workspace_id));

alter publication supabase_realtime add table
  habits, habit_logs, calendars, events, shopping_items, goals, journal_entries;
