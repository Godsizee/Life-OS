import { describe, expect, it } from 'vitest';
import { evaluateTrack } from './checkins.js';
import { trackErklaerung } from './erklaerung.js';

const ziel = {
	id: 'g1',
	title: 'Laufen',
	target_date: '2026-11-01',
	created_at: '2026-10-01T08:00:00',
	status: 'open' as const
};

describe('Warum Auf Kurs', () => {
	it('nennt Soll, Ist, Abstand und verbleibende Tage', () => {
		const heute = new Date(2026, 9, 16); // 15 von 31 Tagen → Soll 48 %
		const track = evaluateTrack(ziel, 20, heute);
		const w = trackErklaerung(ziel, track);
		expect(w.warumJetzt).toBe(`Soll ${track.expected} %, Ist 20 %.`);
		expect(w.daten).toContain('Zeitraum: 01.10.2026 bis 01.11.2026');
		expect(w.daten.some((d) => d.startsWith('Abstand: -'))).toBe(true);
		expect(w.daten).toContain('Verbleibende Tage: 16');
		expect(w.steuerung[0].href).toBe('/goals/g1');
	});

	it('ergänzt die nötige Rate je Tag bei Zielwert-Zielen', () => {
		const track = evaluateTrack(ziel, 50, new Date(2026, 9, 16));
		const w = trackErklaerung(ziel, track, { wert: 2.5, einheit: 'km' });
		expect(w.daten).toContain('Nötig bis zum Zieldatum: 2.5 km pro Tag');
	});

	it('erklärt auch ein Ziel ohne Datum und eines mit vorbeigegangener Frist', () => {
		const ohne = { ...ziel, target_date: null };
		const w = trackErklaerung(ohne, evaluateTrack(ohne, 10));
		expect(w.was).toMatch(/kein Zieldatum/);
		const spaet = evaluateTrack(ziel, 40, new Date(2026, 10, 5));
		expect(trackErklaerung(ziel, spaet).daten).toContain('Frist seit 4 Tagen vorbei');
	});
});
