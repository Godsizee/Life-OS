import { neueId } from '$lib/core/id';
import { supabase } from '$lib/core/supabase';
import { inviteEmailSchema } from './schema';
import type { Invite, Workspace, WorkspaceMember } from './types';

export async function getCurrentWorkspace(): Promise<Workspace | null> {
	const { data, error } = await supabase
		.from('workspaces')
		.select('*')
		.order('created_at', { ascending: true })
		.limit(1)
		.maybeSingle();
	if (error) throw error;
	return data;
}

interface MemberProfileRow {
	workspace_id: string;
	user_id: string;
	role: WorkspaceMember['role'];
	joined_at: string;
	display_name: string | null;
	avatar_url: string | null;
}

/**
 * Ueber RPC statt per Join: die profiles-Policy gibt nur die eigene Zeile frei,
 * ein Join lieferte fuer alle anderen Mitglieder null. Die Funktion ist
 * `security definer` und gibt bewusst nur Name/Avatar heraus, nicht settings.
 */
export async function listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
	const { data, error } = await supabase.rpc('workspace_member_profiles', { ws: workspaceId });
	if (error) throw error;
	return ((data ?? []) as MemberProfileRow[]).map((row) => ({
		workspace_id: row.workspace_id,
		user_id: row.user_id,
		role: row.role,
		joined_at: row.joined_at,
		profile: { display_name: row.display_name, avatar_url: row.avatar_url }
	}));
}

/** Nur der Owner darf umbenennen (RLS-Policy "owners can update workspaces"). */
export async function renameWorkspace(workspaceId: string, name: string): Promise<Workspace> {
	const { data, error } = await supabase
		.from('workspaces')
		.update({ name })
		.eq('id', workspaceId)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function inviteMember(workspaceId: string, email: string): Promise<Invite> {
	const validEmail = inviteEmailSchema.parse(email);
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

	const { data, error } = await supabase
		.from('invites')
		.insert({
			workspace_id: workspaceId,
			email: validEmail,
			token: neueId(),
			expires_at: expiresAt
		})
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function acceptInvite(token: string): Promise<boolean> {
	const { data, error } = await supabase.rpc('accept_invite', { invite_token: token });
	if (error) throw error;
	return data ?? false;
}
