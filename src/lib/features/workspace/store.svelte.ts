import * as workspaceApi from './api';
import type { Workspace, WorkspaceMember } from './types';

class WorkspaceState {
	workspace = $state<Workspace | null>(null);
	members = $state<WorkspaceMember[]>([]);
	loading = $state(false);
	/** Ohne diesen Zustand wartete das Onboarding nach einem Ladefehler ewig. */
	error = $state<string | null>(null);

	async load() {
		this.loading = true;
		this.error = null;
		try {
			this.workspace = await workspaceApi.getCurrentWorkspace();
			if (this.workspace) {
				this.members = await workspaceApi.listMembers(this.workspace.id);
			}
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Unbekannter Fehler';
			throw err;
		} finally {
			this.loading = false;
		}
	}

	reset() {
		this.workspace = null;
		this.members = [];
		this.error = null;
	}

	async rename(name: string) {
		if (!this.workspace) throw new Error('Kein Workspace geladen');
		this.workspace = await workspaceApi.renameWorkspace(this.workspace.id, name);
	}

	async invite(email: string) {
		if (!this.workspace) throw new Error('Kein Workspace geladen');
		await workspaceApi.inviteMember(this.workspace.id, email);
		this.members = await workspaceApi.listMembers(this.workspace.id);
	}

	/** Anzeigename eines Mitglieds; Rückfall auf 'Unbekannt'. Für Metadatenzeilen. */
	memberName(userId: string | null): string | null {
		if (!userId) return null;
		return this.members.find((m) => m.user_id === userId)?.profile?.display_name ?? 'Unbekannt';
	}
}

export const workspaceState = new WorkspaceState();
