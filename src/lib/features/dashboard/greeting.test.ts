import { describe, expect, it } from 'vitest';
import { greetingFor } from './greeting';

describe('greetingFor', () => {
	it('trifft die Tagesabschnitte', () => {
		expect(greetingFor(new Date(2026, 6, 31, 3, 0))).toBe('Gute Nacht');
		expect(greetingFor(new Date(2026, 6, 31, 8, 0))).toBe('Guten Morgen');
		expect(greetingFor(new Date(2026, 6, 31, 12, 30))).toBe('Mahlzeit');
		expect(greetingFor(new Date(2026, 6, 31, 16, 0))).toBe('Guten Tag');
		expect(greetingFor(new Date(2026, 6, 31, 20, 0))).toBe('Guten Abend');
		expect(greetingFor(new Date(2026, 6, 31, 23, 30))).toBe('Gute Nacht');
	});
});
