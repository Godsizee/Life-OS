import { describe, expect, it } from 'vitest';
import { ringMass, ringProzent, ringVersatz } from './ring-kern.js';

describe('ringMass', () => {
	it('legt Farbstrich und beide Rahmenlinien ineinander, ohne den Rand zu überschreiten', () => {
		const m = ringMass(8);
		expect(m.r).toBe(44);
		// Außenlinie: Mitte 49, Stärke 2 → endet bei 50, also genau am Rand der viewBox.
		expect(m.aussen + 1).toBe(50);
		// Innenlinie liegt innerhalb des Farbstrichs (r - strich/2) mit 1 Einheit Abstand zur Mitte der Linie.
		expect(m.innen).toBe(39);
		expect(m.innen + 1).toBe(m.r - 8 / 2);
	});

	it('Umfang folgt dem Radius', () => {
		const m = ringMass(10);
		expect(m.umfang).toBeCloseTo(2 * Math.PI * 43, 5);
	});
});

describe('ringProzent und ringVersatz', () => {
	it('begrenzt auf 0 bis 100', () => {
		expect(ringProzent(-5)).toBe(0);
		expect(ringProzent(140)).toBe(100);
		expect(ringProzent(37)).toBe(37);
	});

	it('behandelt NaN und unendlich als 0', () => {
		expect(ringProzent(Number.NaN)).toBe(0);
		expect(ringProzent(Number.POSITIVE_INFINITY)).toBe(0);
	});

	it('Versatz: 0 % = voller Umfang, 100 % = 0, 50 % = halb', () => {
		expect(ringVersatz(200, 0)).toBe(200);
		expect(ringVersatz(200, 100)).toBe(0);
		expect(ringVersatz(200, 50)).toBe(100);
	});
});
