import { describe, expect, it } from 'vitest';
import { NEUIGKEITEN, neueste, zeigeNeuigkeit, type Neuigkeit } from './neuigkeiten.js';

const liste: Neuigkeit[] = [
	{ version: '2027.2', datum: '', titel: 'Neu', punkte: ['a'] },
	{ version: '2027.1', datum: '', titel: 'Alt', punkte: ['b'] }
];

describe('Was ist neu', () => {
	it('zeigt die neueste Version genau dann, wenn sie noch nicht gesehen wurde', () => {
		expect(zeigeNeuigkeit('', liste)).toBe(true);
		expect(zeigeNeuigkeit('2027.1', liste)).toBe(true);
		expect(zeigeNeuigkeit('2027.2', liste)).toBe(false);
	});

	it('zeigt nichts bei leerer Liste', () => {
		expect(zeigeNeuigkeit('', [])).toBe(false);
	});

	it('die echte Liste hat eine neueste Version mit Punkten und Hilfethema', () => {
		const n = neueste();
		expect(n?.punkte.length).toBeGreaterThan(0);
		expect(NEUIGKEITEN[0].hilfe).toBe('system.was-ist-life-os');
		for (const p of n?.punkte ?? []) expect(p).not.toMatch(/!/);
	});
});
