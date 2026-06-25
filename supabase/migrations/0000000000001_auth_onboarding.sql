-- M0: Auth-Onboarding (Auto-Workspace) + Invite-Annahme

-- 1. Neuer Nutzer -> eigenes Profil + eigenen Workspace + Mitgliedschaft als Owner
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, new.email);

  insert into public.workspaces (name, owner_id)
  values (coalesce(new.email, 'Mein Workspace') || '''s Workspace', new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Invite-Annahme: Einladene sind vor der Annahme noch kein Mitglied, duerfen die
--    invites-Zeile also nicht direkt per RLS lesen/aendern. RPC kapselt die Pruefung.
create function public.accept_invite(invite_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invites;
begin
  select * into inv from public.invites
    where token = invite_token
      and status = 'pending'
      and expires_at > now();

  if inv is null then
    return false;
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (inv.workspace_id, auth.uid(), 'member')
  on conflict (workspace_id, user_id) do nothing;

  update public.invites set status = 'accepted' where id = inv.id;

  return true;
end;
$$;

grant execute on function public.accept_invite(text) to authenticated;
