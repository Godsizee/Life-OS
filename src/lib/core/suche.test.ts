import { describe, expect, it } from 'vitest';
import { sucheIn } from './suche';

const bau = (e: { id: string; t: string }, gewicht: number) => ({
	id: e.id,
	modul: 'tasks' as const,
	titel: e.t,
	href: `/tasks?task=${e.id}`,
	gewicht
});
const daten = [
	{ id: 'a', t: 'Die Steuer machen' },
	{ id: 'b', t: 'Steuererklärung' },
	{ id: 'c', t: 'Wäsche' }
];

describe('sucheIn', () => {
	it('sortiert nach Gewicht und lässt Nichttreffer weg', () => {
		const r = sucheIn(daten, 'steuer', (e) => e.t, bau);
		expect(r.map((x) => x.id)).toEqual(['b', 'a']);
	});
	it('leere Anfrage liefert nichts', () => {
		expect(sucheIn(daten, '  ', (e) => e.t, bau)).toEqual([]);
	});
	it('begrenzt die Anzahl', () => {
		expect(sucheIn(daten, 'e', (e) => e.t, bau, 1)).toHaveLength(1);
	});
});
