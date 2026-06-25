export type WorkspaceRole = 'owner' | 'member';

export interface Workspace {
	id: string;
	name: string;
	owner_id: string;
	plan: string;
	created_at: string;
}

export interface WorkspaceMember {
	workspace_id: string;
	user_id: string;
	role: WorkspaceRole;
	joined_at: string;
	profile?: {
		display_name: string | null;
		avatar_url: string | null;
	};
}

export interface Invite {
	id: string;
	workspace_id: string;
	email: string;
	token: string;
	status: 'pending' | 'accepted';
	expires_at: string;
}
