import { describe, expect, it } from 'vitest';
import { filterNotes, sortNotes, tagUnion, bodySnippet } from './filter';
import type { Note } from './types';

function note(partial: Partial<Note> & { id: string }): Note {
	return {
		workspace_id: 'ws',
		title: '',
		body: '',
		tags: [],
		pinned: false,
		private: false,
		created_by: 'u1',
		updated_by: 'u1',
		created_at: '2026-01-01T00:00:00.000Z',
		updated_at: '2026-01-01T00:00:00.000Z',
		...partial
	};
}

describe('tagUnion', () => {
	it('sammelt und sortiert alle Tags ohne Duplikate', () => {
		const notes = [note({ id: 'a', tags: ['zoo', 'auto'] }), note({ id: 'b', tags: ['auto'] })];
		expect(tagUnion(notes)).toEqual(['auto', 'zoo']);
	});
});

describe('filterNotes', () => {
	const notes = [
		note({ id: 'a', title: 'Einkauf', tags: ['haus'] }),
		note({ id: 'b', title: 'Urlaub', body: 'Flug buchen', tags: ['reise'] })
	];

	it('gibt ohne Filter alles zurueck', () => {
		expect(filterNotes(notes, '', null)).toHaveLength(2);
	});

	it('sucht im Titel', () => {
		expect(filterNotes(notes, 'einkauf', null).map((n) => n.id)).toEqual(['a']);
	});

	it('sucht im Body', () => {
		expect(filterNotes(notes, 'flug', null).map((n) => n.id)).toEqual(['b']);
	});

	it('filtert nach Tag', () => {
		expect(filterNotes(notes, '', 'reise').map((n) => n.id)).toEqual(['b']);
	});

	it('kombiniert Tag und Suche', () => {
		expect(filterNotes(notes, 'urlaub', 'haus')).toHaveLength(0);
	});
});

describe('sortNotes', () => {
	it('setzt Angepinnte in jeder Sortierung nach vorne', () => {
		const notes = [
			note({ id: 'alt', updated_at: '2026-01-01T00:00:00.000Z' }),
			note({ id: 'neu', updated_at: '2026-02-01T00:00:00.000Z' }),
			note({ id: 'pin', pinned: true, updated_at: '2025-01-01T00:00:00.000Z' })
		];
		expect(sortNotes(notes, 'updated').map((n) => n.id)).toEqual(['pin', 'neu', 'alt']);
	});

	it('sortiert nach Titel mit deutscher Kollation', () => {
		const notes = [
			note({ id: 'Z', title: 'Zebra' }),
			note({ id: 'a', title: 'Apfel' }),
			note({ id: 'ae', title: 'Äpfel' })
		];
		expect(sortNotes(notes, 'title').map((n) => n.id)).toEqual(['a', 'ae', 'Z']);
	});
});

describe('bodySnippet', () => {
	it('schneidet um den Treffer herum aus', () => {
		const s = bodySnippet('a'.repeat(100) + 'TREFFER' + 'b'.repeat(100), 'treffer');
		expect(s).toContain('TREFFER');
		expect(s?.startsWith('…')).toBe(true);
		expect(s?.endsWith('…')).toBe(true);
	});

	it('liefert null, wenn der Treffer nicht im Body steht', () => {
		expect(bodySnippet('nur text', 'fehlt')).toBeNull();
	});
});
