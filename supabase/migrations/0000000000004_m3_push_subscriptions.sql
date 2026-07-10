-- M3: Web-Push Subscribe-Infrastruktur (Versand folgt in M4 via Edge Function)

create table push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, endpoint)
);

alter table push_subscriptions enable row level security;

-- Push-Subscriptions sind geraetegebunden und persoenlich, keine Workspace-Freigabe.
create policy "owner rw" on push_subscriptions
  using (user_id = auth.uid()) with check (user_id = auth.uid());
