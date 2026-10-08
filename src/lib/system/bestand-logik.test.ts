import { describe, expect, it } from 'vitest';
import { bestandsPatch } from './bestand-logik';

describe('bestandsPatch', () => {
	it('schaltet bei Bestandsdaten alle abschaltbaren Module ein und merkt sich das Datum', () => {
		const p = bestandsPatch({}, true, '2026-10-08')!;
		expect(p['modul.fitness.aktiv']).toBe(true);
		expect(p['modul.health.aktiv']).toBe(true);
		expect(p['modul.analytics.aktiv']).toBe(true);
		expect(p['modul.dashboard.aktiv']).toBeUndefined(); // Pflichtmodul
		expect(p['setup.abgeschlossen']).toBe('bestand-2026-10-08');
	});

	it('lässt bereits gesetzte Werte unangetastet', () => {
		const p = bestandsPatch({ 'modul.notes.aktiv': false }, true, '2026-10-08')!;
		expect('modul.notes.aktiv' in p).toBe(false);
		expect(p['modul.tasks.aktiv']).toBe(true);
	});

	it('tut nichts bei neuem Konto ohne Daten oder wenn die Einrichtung schon lief', () => {
		expect(bestandsPatch({}, false, '2026-10-08')).toBeNull();
		expect(
			bestandsPatch({ 'setup.abgeschlossen': 'bestand-2026-01-01' }, true, '2026-10-08')
		).toBeNull();
	});
});
