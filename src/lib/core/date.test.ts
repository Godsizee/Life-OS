import { describe, expect, it } from 'vitest';
import { toISODate } from './date';

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
