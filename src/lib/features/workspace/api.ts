import { supabase } from '$lib/core/supabase';
import { inviteEmailSchema } from './schema';
import type { Invite, Workspace, WorkspaceMember } from './types';

export async function getCurrentWorkspace(): Promise<Workspace | null> {
	const { data, error } = await supabase.from('workspaces').select('*').limit(1).maybeSingle();
	if (error) throw error;
	return data;
}

export async function listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
	const { data, error } = await supabase
		.from('workspace_members')
		.select('*, profile:profiles(display_name, avatar_url)')
		.eq('workspace_id', workspaceId);
	if (error) throw error;
	return data ?? [];
}

export async function inviteMember(workspaceId: string, email: string): Promise<Invite> {
	const validEmail = inviteEmailSchema.parse(email);
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

	const { data, error } = await supabase
		.from('invites')
		.insert({
			workspace_id: workspaceId,
			email: validEmail,
			token: crypto.randomUUID(),
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
