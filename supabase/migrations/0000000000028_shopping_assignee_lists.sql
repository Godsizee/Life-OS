alter table public.shopping_items add column if not exists assignee_id uuid references auth.users on delete set null;
alter table public.shopping_items add column if not exists list_id uuid;

create index if not exists shopping_items_list_idx on public.shopping_items (workspace_id, list_id);
create index if not exists shopping_items_assignee_idx on public.shopping_items (workspace_id, assignee_id) where assignee_id is not null;
