import { describe, expect, it } from 'vitest';
import { reviewWeek, weekKey, nextWeekKey } from './week-window';

/** Lokale Mitternacht — dieselbe Basis wie toISODate(). */
function tag(iso: string): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(y, m - 1, d);
}

describe('reviewWeek', () => {
	it('liefert die letzten 7 Tage inklusive heute', () => {
		const { dates } = reviewWeek(tag('2026-07-29')); // Mittwoch
		expect(dates).toEqual([
			'2026-07-23',
			'2026-07-24',
			'2026-07-25',
			'2026-07-26',
			'2026-07-27',
			'2026-07-28',
			'2026-07-29'
		]);
	});

	it('endet immer auf heute und ist 7 Tage lang — an JEDEM Wochentag', () => {
		// Der alte Code (`getDate() - getDay() - 6`) lieferte an sechs von sieben
		// Tagen Mo–So der VORWOCHE und nur sonntags die laufende Woche.
		for (const iso of [
			'2026-07-26', // So
			'2026-07-27', // Mo
			'2026-07-28', // Di
			'2026-07-29', // Mi
			'2026-07-30', // Do
			'2026-07-31', // Fr
			'2026-08-01' //  Sa
		]) {
			const { dates } = reviewWeek(tag(iso));
			expect(dates).toHaveLength(7);
			expect(dates.at(-1)).toBe(iso);
		}
	});

	it('haelt start/end konsistent zu dates', () => {
		const { start, end, dates } = reviewWeek(tag('2026-03-03'));
		expect(dates[0]).toBe('2026-02-25');
		expect(start.getDate()).toBe(25);
		expect(start.getMonth()).toBe(1); // Februar
		expect(end.getDate()).toBe(3);
	});

	it('rechnet ueber Monats- und Jahresgrenzen korrekt', () => {
		expect(reviewWeek(tag('2026-01-02')).dates).toEqual([
			'2025-12-27',
			'2025-12-28',
			'2025-12-29',
			'2025-12-30',
			'2025-12-31',
			'2026-01-01',
			'2026-01-02'
		]);
	});

	it('ignoriert die Uhrzeit des Referenzzeitpunkts', () => {
		const frueh = reviewWeek(new Date(2026, 6, 29, 0, 5));
		const spaet = reviewWeek(new Date(2026, 6, 29, 23, 55));
		expect(frueh.dates).toEqual(spaet.dates);
	});

	it('respektiert eine abweichende Fensterlaenge', () => {
		expect(reviewWeek(tag('2026-07-29'), 3).dates).toEqual([
			'2026-07-27',
			'2026-07-28',
			'2026-07-29'
		]);
	});
});

describe('weekKey / nextWeekKey', () => {
	it('liefert den Montag der Woche', () => {
		expect(weekKey(tag('2026-07-31'))).toBe('2026-07-27'); // Freitag → Montag davor
		expect(weekKey(tag('2026-07-27'))).toBe('2026-07-27'); // Montag → er selbst
	});

	it('behandelt Sonntag als Wochenende, nicht als Wochenanfang', () => {
		expect(weekKey(tag('2026-08-02'))).toBe('2026-07-27'); // Sonntag
	});

	it('nextWeekKey ist genau 7 Tage später', () => {
		expect(nextWeekKey(tag('2026-07-31'))).toBe('2026-08-03');
	});
});
