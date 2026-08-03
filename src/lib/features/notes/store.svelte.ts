import { neueId } from '$lib/core/id';
import { authState } from '$lib/core/auth.svelte';
import { attachmentsState } from '$lib/features/attachments/store.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import { ladeSicher } from '$lib/core/store-load';
import { loeschenMitUndo } from '$lib/core/undo';
import * as notesApi from './api';
import { noteInputSchema } from './schema';
import type { Note } from './types';

class NotesState {
	notes = $state<Note[]>([]);
	loading = $state(false);
	loaded = $state(false);
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
		const ok = await ladeSicher('Notizen', async () => {
			this.notes = await notesApi.listNotes(workspaceId);
		});
		this.loading = false;
		if (!ok) {
			this.workspaceId = null;
			return;
		}
		this.loaded = true;
		this.subscribe();
	}

	private subscribe() {
		this.unsubscribe?.();
		if (!this.workspaceId) return;
		const visible = (row: Note) => !row.private || row.created_by === authState.user?.id;
		this.unsubscribe = subscribeToTable<Note>('notes', this.workspaceId, {
			onInsert: (row) => {
				if (!visible(row)) return;
				if (!this.notes.some((n) => n.id === row.id)) this.notes = [row, ...this.notes];
			},
			onUpdate: (row) => {
				if (!visible(row)) {
					this.notes = this.notes.filter((n) => n.id !== row.id);
					return;
				}
				this.notes = this.notes.map((n) => (n.id === row.id ? row : n));
			},
			onDelete: ({ id }) => {
				this.notes = this.notes.filter((n) => n.id !== id);
			}
		});
	}

	/** Erneut vom Server laden — Abgleich nach Verbindungsabbruch (core/resync.ts). */
	async reload(workspaceId: string) {
		this.workspaceId = null;
		await this.load(workspaceId);
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.notes = [];
		this.loaded = false;
		this.workspaceId = null;
	}

	async addNote(input: { title: string; body?: string; tags?: string[]; private?: boolean }) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = noteInputSchema.parse(input);
		const now = new Date().toISOString();
		const note: Note = {
			id: neueId(),
			workspace_id: this.workspaceId,
			title: parsed.title,
			body: parsed.body,
			tags: parsed.tags,
			pinned: false,
			private: parsed.private,
			created_by: authState.user!.id,
			updated_by: authState.user!.id,
			created_at: now,
			updated_at: now
		};
		this.notes = [note, ...this.notes];
		await outbox.runOrQueue('notes', 'insert', note, () => notesApi.insertRaw(note));
	}

	async updateNote(
		id: string,
		patch: Partial<Pick<Note, 'title' | 'body' | 'tags' | 'private'>>
	) {
		const updated_at = new Date().toISOString();
		const updated_by = authState.user!.id;
		this.notes = this.notes.map((n) =>
			n.id === id ? { ...n, ...patch, updated_at, updated_by } : n
		);
		await outbox.runOrQueue('notes', 'update', { id, ...patch, updated_at, updated_by }, () =>
			notesApi.updateRaw({ id, ...patch, updated_at, updated_by })
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
		// Polymorphe Anhaenge haben keinen FK-Cascade -> explizit mitloeschen.
		await attachmentsState.removeForEntity('note', id);
		await outbox.runOrQueue('notes', 'delete', { id }, () => notesApi.deleteNote(id));
	}

	/** Löschen mit Rücknahmefenster — für die Wischgeste. Siehe core/undo.ts. */
	removeNoteWithUndo(id: string) {
		const note = this.notes.find((n) => n.id === id);
		if (!note) return;
		loeschenMitUndo({
			text: 'Notiz gelöscht',
			ausblenden: () => (this.notes = this.notes.filter((n) => n.id !== id)),
			wiederherstellen: () => {
				if (!this.notes.some((n) => n.id === id)) this.notes = [...this.notes, note];
			},
			// Anhänge erst hier: eine Rücknahme soll sie nicht neu hochladen müssen.
			festschreiben: async () => {
				await attachmentsState.removeForEntity('note', id);
				await outbox.runOrQueue('notes', 'delete', { id }, () => notesApi.deleteNote(id));
			}
		});
	}
}

export const notesState = new NotesState();
