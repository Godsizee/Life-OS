-- M0: Init Workspace and RLS Baseline

-- 1. Tables
create table profiles (
  user_id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  settings jsonb default '{}'::jsonb
);

create table workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  owner_id uuid references auth.users not null,
  plan text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create type workspace_role as enum ('owner', 'member');

create table workspace_members (
  workspace_id uuid references workspaces on delete cascade,
  user_id uuid references profiles on delete cascade,
  role workspace_role default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (workspace_id, user_id)
);

create table invites (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade,
  email text not null,
  token text not null unique,
  status text default 'pending',
  expires_at timestamp with time zone not null
);

create or replace function public.is_member(ws uuid) returns boolean
  language plpgsql security definer stable 
  set search_path = public as $$
  begin
    return exists(
      select 1 from public.workspace_members
      where workspace_id = ws and user_id = auth.uid()
    );
  end;
$$;

create or replace function public.is_owner(ws uuid) returns boolean
  language plpgsql security definer stable 
  set search_path = public as $$
  begin
    return exists(
      select 1 from public.workspace_members
      where workspace_id = ws and user_id = auth.uid() and role = 'owner'
    );
  end;
$$;

-- 3. RLS Policies

-- Enable RLS
alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table invites enable row level security;

-- Profiles: Users can read all (or restrict to own/workspace members later), for now let's allow users to read/update their own
create policy "users can read own profile" on profiles
  for select using (auth.uid() = user_id);
create policy "users can update own profile" on profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Workspaces: Members can read, Owners can update
create policy "members can read workspaces" on workspaces
  for select using (is_member(id));
create policy "owners can update workspaces" on workspaces
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Workspace Members: Members can read members of their workspace
create policy "members can read members" on workspace_members
  for select using (is_member(workspace_id));
-- Only owners can invite/manage members, simplified for now:
create policy "owners can manage members" on workspace_members
  for all using (is_owner(workspace_id));

-- Invites: Members can read invites
create policy "members can read invites" on invites
  for select using (is_member(workspace_id));
-- Owners can create/manage invites
create policy "owners can manage invites" on invites
  for all using (is_owner(workspace_id));
