import { describe, expect, it } from 'vitest';
import { formatDauer, formatTagKurz, formatUhr, nachUhrzeit, toISODate } from './date';

describe('toISODate', () => {
	it('liefert das LOKALE Datum, nicht UTC', () => {
		// 31.07.2026, 23:30 Ortszeit — in UTC bereits der 31.07. 21:30 bzw. 1.8. je nach Zone.
		const abends = new Date(2026, 6, 31, 23, 30, 0);
		expect(toISODate(abends)).toBe('2026-07-31');
	});

	it('kippt nicht am Monatsanfang', () => {
		expect(toISODate(new Date(2026, 7, 1, 0, 15, 0))).toBe('2026-08-01');
	});
});

describe('Kurzformate für Vorschauen', () => {
	it('formatTagKurz, formatUhr', () => {
		const d = new Date(2026, 9, 8, 7, 5); // Do 08.10.2026
		expect(formatTagKurz(d)).toBe('Do 08.10.');
		expect(formatUhr(d)).toBe('07:05');
	});
	it('formatDauer', () => {
		expect(formatDauer(30)).toBe('30 min');
		expect(formatDauer(60)).toBe('1 h');
		expect(formatDauer(90)).toBe('1 h 30 min');
	});
});

describe('nachUhrzeit', () => {
	it('vergleicht lokale Uhrzeit mit hh:mm', () => {
		expect(nachUhrzeit(new Date(2026, 9, 8, 17, 59), '18:00')).toBe(false);
		expect(nachUhrzeit(new Date(2026, 9, 8, 18, 0), '18:00')).toBe(true);
		expect(nachUhrzeit(new Date(2026, 9, 8, 9, 5), '9:05')).toBe(true);
	});
	it('ungültige Angabe gilt als erfüllt', () => {
		expect(nachUhrzeit(new Date(2026, 9, 8, 1, 0), 'abends')).toBe(true);
	});
});
