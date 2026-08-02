import { describe, expect, it } from 'vitest';
import { vergleiche } from './week-compare';

describe('vergleiche', () => {
	it('erkennt Verbesserung', () => {
		const v = vergleiche({ id: 'x', label: 'Aufgaben', wert: 12, vorwoche: 8 })!;
		expect(v.richtung).toBe('up');
		expect(v.delta).toBe(4);
		expect(v.prozent).toBe(50);
		expect(v.gut).toBe(true);
	});

	it('wertet "weniger ist besser" richtig', () => {
		const v = vergleiche({ id: 'x', label: 'Überfällig', wert: 2, vorwoche: 6, hoeherIstBesser: false })!;
		expect(v.richtung).toBe('down');
		expect(v.gut).toBe(true);
	});

	it('ignoriert Änderungen unter 5 %', () => {
		expect(vergleiche({ id: 'x', label: 'y', wert: 102, vorwoche: 100 })!.richtung).toBe('flat');
	});

	it('kommt mit Vorwoche = 0 klar', () => {
		const v = vergleiche({ id: 'x', label: 'y', wert: 3, vorwoche: 0 })!;
		expect(v.richtung).toBe('up');
		expect(v.prozent).toBeNull();
	});

	it('liefert null ohne Vorwochendaten', () => {
		expect(vergleiche({ id: 'x', label: 'y', wert: 3, vorwoche: null })).toBeNull();
	});
});
