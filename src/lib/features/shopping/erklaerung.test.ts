import { describe, expect, it } from 'vitest';
import { kategorieErklaerung } from './erklaerung';
import type { KaufStatistik } from './types';

const stat = (teil: Partial<KaufStatistik>): KaufStatistik => ({
	name: 'hafermilch',
	label: 'Hafermilch',
	category: 'drinks',
	count: 4,
	last: '2026-10-01T10:00:00Z',
	...teil
});

describe('Warum diese Kategorie', () => {
	it('nennt den Verlauf, wenn der Artikel schon einsortiert wurde', () => {
		const w = kategorieErklaerung('Hafermilch', [stat({})]);
		expect(w?.warumJetzt).toBe('Du hast den Artikel 4× gekauft, zuletzt in dieser Kategorie.');
		expect(w?.daten[0]).toBe('Quelle: dein Kaufverlauf (4×)');
	});

	it('nennt sonst das Stichwort aus der Wortliste', () => {
		const w = kategorieErklaerung('Vollmilch', []);
		expect(w?.warumJetzt).toMatch(/Stichwort „milch“/);
		expect(w?.daten[0]).toBe('Quelle: Wortliste (Stichwort „milch“)');
	});

	it('sagt ehrlich, wenn nichts passt, und schweigt bei leerem Namen', () => {
		expect(kategorieErklaerung('Zzyzx', [])?.daten[0]).toMatch(/keine/);
		expect(kategorieErklaerung('   ', [])).toBeNull();
	});
});
