import { describe, expect, it } from 'vitest';
import { koordinaten, pfad, wertebereich, xPos, yPos } from './linie-kern.js';

const MASS = { breite: 100, hoehe: 50, rand: 5 };

describe('wertebereich', () => {
	it('beginnt ohne Vorgabe bei 0 und ignoriert Lücken', () => {
		expect(wertebereich([[3, null, 9]])).toEqual({ min: 0, max: 9 });
	});

	it('nimmt negative Werte und Zusatzwerte (Ziel) mit', () => {
		expect(wertebereich([[-2, 4]], [10])).toEqual({ min: -2, max: 10 });
	});

	it('nutzt die Vorgabe, z. B. 0 bis 100 für den Score', () => {
		expect(wertebereich([[20, 40]], [], { min: 0, max: 100 })).toEqual({ min: 0, max: 100 });
	});

	it('zoomt bei Werten weit über 0 auf den Bereich mit Luft', () => {
		const b = wertebereich([[82, 84, 83]]);
		expect(b.min).toBeLessThan(82);
		expect(b.min).toBeGreaterThan(81);
		expect(b.max).toBeGreaterThan(84);
		expect(b.max).toBeLessThan(85);
	});

	it('gibt gleichen Werten eine Spanne, damit nichts durch 0 geteilt wird', () => {
		const b = wertebereich([[80, 80]]);
		expect(b.max).toBeGreaterThan(b.min);
	});

	it('liefert für leere Daten einen gültigen Bereich', () => {
		expect(wertebereich([[]])).toEqual({ min: 0, max: 1 });
	});
});

describe('Position', () => {
	it('verteilt Punkte über die Breite mit Rand', () => {
		expect(xPos(0, 3, MASS)).toBe(5);
		expect(xPos(1, 3, MASS)).toBe(50);
		expect(xPos(2, 3, MASS)).toBe(95);
	});

	it('setzt einen einzelnen Punkt in die Mitte', () => {
		expect(xPos(0, 1, MASS)).toBe(50);
	});

	it('legt den Höchstwert nach oben und den Mindestwert nach unten', () => {
		const bereich = { min: 0, max: 10 };
		expect(yPos(10, bereich, MASS)).toBe(5);
		expect(yPos(0, bereich, MASS)).toBe(45);
	});
});

describe('pfad', () => {
	it('verbindet zusammenhängende Punkte', () => {
		const k = koordinaten(
			[
				{ label: 'a', value: 0 },
				{ label: 'b', value: 10 }
			],
			{ min: 0, max: 10 },
			MASS
		);
		expect(pfad(k)).toBe('M5.0,45.0 L95.0,5.0');
	});

	it('bricht an einer Lücke ab und beginnt neu', () => {
		const k = koordinaten(
			[
				{ label: 'a', value: 0 },
				{ label: 'b', value: null },
				{ label: 'c', value: 10 },
				{ label: 'd', value: 10 }
			],
			{ min: 0, max: 10 },
			MASS
		);
		expect(pfad(k)).toBe('M5.0,45.0 M65.0,5.0 L95.0,5.0');
	});

	it('liefert für lauter Lücken einen leeren Pfad', () => {
		expect(pfad([null, null])).toBe('');
	});
});
