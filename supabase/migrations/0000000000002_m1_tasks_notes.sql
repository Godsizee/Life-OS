-- M1: Aufgaben & Projekte, Notizen + RLS + Realtime

create type task_status as enum ('todo', 'doing', 'done');
create type task_priority as enum ('low', 'medium', 'high');

create table projects (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  name text not null,
  color text,
  archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table tasks (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  project_id uuid references projects on delete set null,
  title text not null,
  status task_status default 'todo' not null,
  priority task_priority default 'medium' not null,
  due_at timestamp with time zone,
  assignee_id uuid references auth.users,
  rrule text,
  position integer default 0,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table notes (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  title text not null,
  body text default '',
  tags text[] default '{}',
  pinned boolean default false,
  updated_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table projects enable row level security;
alter table tasks enable row level security;
alter table notes enable row level security;

create policy "members rw" on projects
  using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy "members rw" on tasks
  using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy "members rw" on notes
  using (is_member(workspace_id)) with check (is_member(workspace_id));

alter publication supabase_realtime add table projects, tasks, notes;
