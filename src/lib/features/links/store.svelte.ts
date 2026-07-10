import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as linksApi from './api';
import type { EntityLink, LinkEntityType } from './types';

class LinksState {
	links = $state<EntityLink[]>([]);
	private workspaceId: string | null = null;
	private unsub: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('entity_links', {
			insert: (p) => linksApi.insertLinkRaw(p as EntityLink),
			delete: (p) => linksApi.deleteLink((p as { id: string }).id)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.links = await linksApi.listLinks(workspaceId);
		this.subscribe();
	}

	private subscribe() {
		this.unsub?.();
		if (!this.workspaceId) return;
		this.unsub = subscribeToTable<EntityLink>('entity_links', this.workspaceId, {
			onInsert: (row) => {
				if (!this.links.some((l) => l.id === row.id)) this.links = [...this.links, row];
			},
			onDelete: ({ id }) => {
				this.links = this.links.filter((l) => l.id !== id);
			}
		});
	}

	unload() {
		this.unsub?.();
		this.unsub = null;
		this.links = [];
		this.workspaceId = null;
	}

	/** Alle Links, an denen die Entität als Quelle ODER Ziel beteiligt ist. */
	linksFor(type: LinkEntityType, id: string): EntityLink[] {
		return this.links.filter(
			(l) =>
				(l.source_type === type && l.source_id === id) ||
				(l.target_type === type && l.target_id === id)
		);
	}

	async add(
		sourceType: LinkEntityType,
		sourceId: string,
		targetType: LinkEntityType,
		targetId: string
	) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		if (sourceType === targetType && sourceId === targetId) return;
		const dup = this.links.some(
			(l) =>
				(l.source_type === sourceType &&
					l.source_id === sourceId &&
					l.target_type === targetType &&
					l.target_id === targetId) ||
				(l.source_type === targetType &&
					l.source_id === targetId &&
					l.target_type === sourceType &&
					l.target_id === sourceId)
		);
		if (dup) return;
		const link: EntityLink = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			source_type: sourceType,
			source_id: sourceId,
			target_type: targetType,
			target_id: targetId,
			created_by: authState.user!.id,
			created_at: new Date().toISOString()
		};
		this.links = [...this.links, link];
		await outbox.runOrQueue('entity_links', 'insert', link, () => linksApi.insertLinkRaw(link));
	}

	async remove(id: string) {
		this.links = this.links.filter((l) => l.id !== id);
		await outbox.runOrQueue('entity_links', 'delete', { id }, () => linksApi.deleteLink(id));
	}
}

export const linksState = new LinksState();
