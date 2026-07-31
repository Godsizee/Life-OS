import type { JournalEntry, JournalKind } from './types';
import { bodySnippet } from '$lib/core/text';

export interface JournalFilter {
	query: string;
	/** null = alle Arten. */
	kind: JournalKind | null;
	/** 'yyyy-mm' oder null. */
	month: string | null;
	/** null = alle Stimmungen. */
	mood: string | null;
}

export function filterJournal(entries: JournalEntry[], f: JournalFilter): JournalEntry[] {
	const q = f.query.trim().toLowerCase();
	return entries.filter((e) => {
		if (f.kind && e.kind !== f.kind) return false;
		if (f.month && !e.date.startsWith(f.month)) return false;
		if (f.mood && e.mood !== f.mood) return false;
		if (!q) return true;
		return e.body.toLowerCase().includes(q);
	});
}

/** Alle Monate mit Einträgen, absteigend — für den Monatswähler. */
export function monthsWithEntries(entries: JournalEntry[]): string[] {
	return [...new Set(entries.map((e) => e.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
}

export { bodySnippet as journalSnippet };
