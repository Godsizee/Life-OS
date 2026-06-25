import * as workspaceApi from './api';
import type { Workspace, WorkspaceMember } from './types';

class WorkspaceState {
	workspace = $state<Workspace | null>(null);
	members = $state<WorkspaceMember[]>([]);
	loading = $state(false);

	async load() {
		this.loading = true;
		try {
			this.workspace = await workspaceApi.getCurrentWorkspace();
			if (this.workspace) {
				this.members = await workspaceApi.listMembers(this.workspace.id);
			}
		} finally {
			this.loading = false;
		}
	}

	reset() {
		this.workspace = null;
		this.members = [];
	}

	async invite(email: string) {
		if (!this.workspace) throw new Error('Kein Workspace geladen');
		await workspaceApi.inviteMember(this.workspace.id, email);
		this.members = await workspaceApi.listMembers(this.workspace.id);
	}
}

export const workspaceState = new WorkspaceState();
