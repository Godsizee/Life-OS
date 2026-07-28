-- Sharing-Reparatur: die Mitgliederliste zeigte statt Namen die rohe User-UUID.
-- Idempotent (mehrfach ausfuehrbar).
--
-- URSACHE: workspace/api.ts joint `profiles(display_name, avatar_url)`, die
-- Policy aus Migration 0 erlaubt `select` auf profiles aber nur fuer
-- `auth.uid() = user_id`. Fuer jedes andere Mitglied liefert der Join null,
-- MemberList.svelte faellt auf member.user_id zurueck.
--
-- BEWUSST KEINE breite profiles-Policy: RLS ist zeilen-, nicht spaltenbasiert.
-- `profiles.settings` enthaelt persoenliche Daten (Zielgewicht, Schlaf-/Wasser-
-- ziele, Fokus-Einstellungen). Ein `for select using (is_member(...))` wuerde
-- die dem ganzen Haushalt oeffnen. Stattdessen gibt diese Funktion genau die
-- vier Felder heraus, die die Mitgliederliste braucht.

create or replace function public.workspace_member_profiles(ws uuid)
returns table (
  workspace_id uuid,
  user_id uuid,
  role workspace_role,
  joined_at timestamptz,
  display_name text,
  avatar_url text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    wm.workspace_id,
    wm.user_id,
    wm.role,
    wm.joined_at,
    p.display_name,
    p.avatar_url
  from public.workspace_members wm
  left join public.profiles p on p.user_id = wm.user_id
  -- Der Aufrufer muss selbst Mitglied sein; sonst leere Menge statt Fehler.
  where wm.workspace_id = ws
    and public.is_member(ws);
$$;

revoke execute on function public.workspace_member_profiles(uuid) from public, anon;
grant execute on function public.workspace_member_profiles(uuid) to authenticated;
