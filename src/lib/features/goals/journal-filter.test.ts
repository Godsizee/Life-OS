import { describe, expect, it } from 'vitest';
import { filterJournal, monthsWithEntries, journalSnippet } from './journal-filter';
import type { JournalEntry } from './types';

const sampleEntries: JournalEntry[] = [
	{
		id: '1',
		workspace_id: 'w1',
		user_id: 'u1',
		date: '2026-07-15',
		mood: 'happy',
		body: 'Heute war ein fantastischer Tag im Park mit Freunden.',
		context: null,
		kind: 'daily',
		created_at: '2026-07-15T12:00:00Z',
		updated_at: '2026-07-15T12:00:00Z'
	},
	{
		id: '2',
		workspace_id: 'w1',
		user_id: 'u1',
		date: '2026-06-30',
		mood: 'neutral',
		body: 'Monatsrückblick Juni: Viel erreicht.',
		context: null,
		kind: 'weekly',
		created_at: '2026-06-30T12:00:00Z',
		updated_at: '2026-06-30T12:00:00Z'
	}
];

describe('filterJournal', () => {
	it('filtert nach Art, Monat, Stimmung und Volltext gleichzeitig', () => {
		const res = filterJournal(sampleEntries, {
			query: 'Park',
			kind: 'daily',
			month: '2026-07',
			mood: 'happy'
		});
		expect(res).toHaveLength(1);
		expect(res[0].id).toBe('1');
	});

	it('leerer Query filtert nichts weg', () => {
		const res = filterJournal(sampleEntries, {
			query: '',
			kind: null,
			month: null,
			mood: null
		});
		expect(res).toHaveLength(2);
	});
});

describe('monthsWithEntries', () => {
	it('liefert eindeutige Monate absteigend', () => {
		const months = monthsWithEntries(sampleEntries);
		expect(months).toEqual(['2026-07', '2026-06']);
	});
});

describe('journalSnippet', () => {
	it('liefert Treffer mit Kontext', () => {
		const snip = journalSnippet('Text mit Treffer im Satz', 'treffer');
		expect(snip).toContain('Treffer');
	});
});
