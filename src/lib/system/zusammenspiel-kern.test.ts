import { describe, expect, it } from 'vitest';
import { ZUSAMMENSPIEL } from '#lib/features/hilfe/inhalte/zusammenspiel.js';
import { regelStatus, zusammenspielFuer } from './zusammenspiel-kern.js';

const ALLE = [
	'dashboard',
	'tasks',
	'notes',
	'habits',
	'calendar',
	'shopping',
	'goals',
	'journal',
	'focus',
	'review',
	'mood',
	'health',
	'fitness',
	'analytics',
	'timeline'
] as const;

describe('zusammenspielFuer', () => {
	it('trennt Liefern und Bekommen', () => {
		const r = zusammenspielFuer('goals', [...ALLE], ZUSAMMENSPIEL);
		expect(r.liefertAn).toEqual([]);
		expect(r.bekommtVon.map((e) => e.mit).sort()).toEqual(['fitness', 'habits', 'tasks']);
		const t = zusammenspielFuer('tasks', [...ALLE], ZUSAMMENSPIEL);
		expect(t.liefertAn.map((e) => e.mit)).toEqual(['goals', 'focus', 'calendar']);
		expect(t.bekommtVon.map((e) => e.mit).sort()).toEqual(['notes', 'review']);
	});

	it('blendet Beziehungen zu ausgeschalteten Modulen aus', () => {
		const ohneZiele = ALLE.filter((m) => m !== 'goals');
		const r = zusammenspielFuer('tasks', [...ohneZiele], ZUSAMMENSPIEL);
		expect(r.liefertAn.map((e) => e.mit)).toEqual(['focus', 'calendar']);
		const g = zusammenspielFuer('habits', [...ohneZiele], ZUSAMMENSPIEL);
		expect(g.liefertAn).toEqual([]);
	});

	it('jedes Ziel in den Daten ist ein bekanntes Modul', () => {
		for (const eintraege of Object.values(ZUSAMMENSPIEL))
			for (const e of eintraege ?? []) expect(ALLE).toContain(e.mit);
	});
});

describe('regelStatus', () => {
	it('gilt nur bei eingeschaltetem Hauptschalter und aktiver Regel', () => {
		expect(regelStatus(true, undefined, true)).toBe('aktiv');
		expect(regelStatus(true, false, true)).toBe('aus');
		expect(regelStatus(true, true, false)).toBe('aktiv');
		expect(regelStatus(false, true, true)).toBe('aus');
	});
});
