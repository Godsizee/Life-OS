import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as notesApi from './api';
import { noteInputSchema } from './schema';
import type { Note } from './types';

class NotesState {
	notes = $state<Note[]>([]);
	loading = $state(false);
	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('notes', {
			insert: (payload) => notesApi.insertRaw(payload as Note),
			update: (payload) => notesApi.updateRaw(payload as Partial<Note> & { id: string }),
			delete: (payload) => notesApi.deleteNote((payload as { id: string }).id)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		try {
			this.notes = await notesApi.listNotes(workspaceId);
		} finally {
			this.loading = false;
		}
		this.subscribe();
	}

	private subscribe() {
		this.unsubscribe?.();
		if (!this.workspaceId) return;
		this.unsubscribe = subscribeToTable<Note>('notes', this.workspaceId, {
			onInsert: (row) => {
				if (!this.notes.some((n) => n.id === row.id)) this.notes = [row, ...this.notes];
			},
			onUpdate: (row) => {
				this.notes = this.notes.map((n) => (n.id === row.id ? row : n));
			},
			onDelete: ({ id }) => {
				this.notes = this.notes.filter((n) => n.id !== id);
			}
		});
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.notes = [];
		this.workspaceId = null;
	}

	async addNote(input: { title: string; body?: string }) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = noteInputSchema.parse(input);
		const now = new Date().toISOString();
		const note: Note = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			title: parsed.title,
			body: parsed.body,
			tags: parsed.tags,
			pinned: false,
			updated_by: authState.user!.id,
			created_at: now,
			updated_at: now
		};
		this.notes = [note, ...this.notes];
		await outbox.runOrQueue('notes', 'insert', note, () => notesApi.insertRaw(note));
	}

	async updateNote(id: string, patch: Partial<Pick<Note, 'title' | 'body' | 'tags'>>) {
		const updated_at = new Date().toISOString();
		this.notes = this.notes.map((n) => (n.id === id ? { ...n, ...patch, updated_at } : n));
		await outbox.runOrQueue('notes', 'update', { id, ...patch, updated_at }, () =>
			notesApi.updateRaw({ id, ...patch, updated_at })
		);
	}

	async togglePin(id: string) {
		const note = this.notes.find((n) => n.id === id);
		if (!note) return;
		const pinned = !note.pinned;
		this.notes = this.notes.map((n) => (n.id === id ? { ...n, pinned } : n));
		await outbox.runOrQueue('notes', 'update', { id, pinned }, () =>
			notesApi.updateRaw({ id, pinned })
		);
	}

	async removeNote(id: string) {
		this.notes = this.notes.filter((n) => n.id !== id);
		await outbox.runOrQueue('notes', 'delete', { id }, () => notesApi.deleteNote(id));
	}
}

export const notesState = new NotesState();
