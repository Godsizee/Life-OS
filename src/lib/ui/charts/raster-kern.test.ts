import { describe, expect, it } from 'vitest';
import { monatsLabels, rasterMass } from './raster-kern.js';

describe('rasterMass', () => {
	it('rechnet Breite und Höhe aus Zellen, Abstand und Beschriftungen', () => {
		const m = rasterMass(12, 7, { zelle: 11, abstand: 2, kopf: 16, links: 0 });
		expect(m.schritt).toBe(13);
		expect(m.breite).toBe(12 * 13 - 2 + 2);
		expect(m.hoehe).toBe(16 + 7 * 13 - 2 + 2);
	});

	it('reserviert links Platz für Zeilenlabels', () => {
		const m = rasterMass(2, 2, { zelle: 10, abstand: 2, kopf: 0, links: 20 });
		expect(m.links).toBe(20);
		expect(m.breite).toBe(20 + 2 * 12);
	});
});

describe('monatsLabels', () => {
	it('setzt den Monatsnamen über die Woche, in der der Monat wechselt', () => {
		const wochen = [
			['2026-09-21', '2026-09-22'],
			['2026-09-28', '2026-09-29'],
			['2026-10-05', '2026-10-06'],
			['2026-10-12', '2026-10-13']
		];
		expect(monatsLabels(wochen)).toEqual([
			{ index: 0, text: 'Sep' },
			{ index: 2, text: 'Okt' }
		]);
	});

	it('überspringt leere Wochen', () => {
		expect(monatsLabels([[]])).toEqual([]);
	});
});
