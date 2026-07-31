import type { Note } from './types';

/** Alle im Workspace vergebenen Tags, alphabetisch (Muster labelUnion aus tasks/utils.ts). */
export function tagUnion(notes: Note[]): string[] {
	const set = new Set<string>();
	for (const note of notes) for (const tag of note.tags ?? []) set.add(tag);
	return [...set].sort((a, b) => a.localeCompare(b));
}

/** Volltextfilter ueber Titel, Body und Tags + optionaler Tag-Filter. */
export function filterNotes(notes: Note[], query: string, tag: string | null): Note[] {
	const q = query.trim().toLowerCase();
	return notes.filter((note) => {
		if (tag && !(note.tags ?? []).includes(tag)) return false;
		if (!q) return true;
		return (
			note.title.toLowerCase().includes(q) ||
			note.body.toLowerCase().includes(q) ||
			(note.tags ?? []).some((t) => t.toLowerCase().includes(q))
		);
	});
}

export type NoteSort = 'updated' | 'created' | 'title';

export const NOTE_SORT_LABELS: Record<NoteSort, string> = {
	updated: 'Zuletzt geändert',
	created: 'Neueste zuerst',
	title: 'Titel A–Z'
};

/** Angepinnte stehen in JEDER Sortierung oben — das ist der Zweck des Anpinnens. */
export function sortNotes(notes: Note[], sort: NoteSort = 'updated'): Note[] {
	const vergleich: Record<NoteSort, (a: Note, b: Note) => number> = {
		updated: (a, b) => b.updated_at.localeCompare(a.updated_at),
		created: (a, b) => b.created_at.localeCompare(a.created_at),
		title:   (a, b) => a.title.localeCompare(b.title, 'de')
	};
	return [...notes].sort(
		(a, b) => Number(b.pinned) - Number(a.pinned) || vergleich[sort](a, b)
	);
}

export interface NoteMatch {
	note: Note;
	/** Textausschnitt um den Treffer im Body; null, wenn nur Titel/Tag getroffen hat. */
	snippet: string | null;
}

/** Filtert und liefert gleich den Grund des Treffers mit. */
export function searchNotes(notes: Note[], query: string, tag: string | null): NoteMatch[] {
	const q = query.trim().toLowerCase();
	return filterNotes(notes, query, tag).map((note) => ({
		note,
		snippet: q ? bodySnippet(note.body, q) : null
	}));
}

import { bodySnippet } from '$lib/core/text';
export { bodySnippet };
