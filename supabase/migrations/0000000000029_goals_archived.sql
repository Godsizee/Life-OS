alter table public.goals add column if not exists archived boolean not null default false;
create index if not exists goals_active_idx on public.goals (workspace_id, archived, status);
