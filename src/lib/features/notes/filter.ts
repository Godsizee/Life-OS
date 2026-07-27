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

/** Angepinnte zuerst, danach nach Aenderungsdatum — spiegelt die Sortierung aus api.ts. */
export function sortNotes(notes: Note[]): Note[] {
	return [...notes].sort(
		(a, b) =>
			Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at)
	);
}
