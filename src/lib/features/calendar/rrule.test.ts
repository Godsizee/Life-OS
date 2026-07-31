import { describe, expect, it } from 'vitest';
import { buildRrule, parseRrule, formatRecurrence, LEERE_REGEL, type RecurrenceForm } from './rrule';

describe('buildRrule / parseRrule — Rundreise', () => {
	const faelle: RecurrenceForm[] = [
		{ freq: 'daily',   interval: 1, byday: [],        ende: 'nie',  until: null,         count: null },
		{ freq: 'weekly',  interval: 2, byday: [2],       ende: 'nie',  until: null,         count: null },
		{ freq: 'weekly',  interval: 1, byday: [1, 3, 5], ende: 'am',   until: '2026-12-31', count: null },
		{ freq: 'monthly', interval: 3, byday: [],        ende: 'nach', until: null,         count: 10 }
	];

	it.each(faelle)('überlebt Bauen und Parsen ohne Verlust', (form) => {
		expect(parseRrule(buildRrule(form))).toEqual(form);
	});

	it('erzeugt die erwarteten Strings', () => {
		expect(buildRrule(faelle[1])).toBe('RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU');
		expect(buildRrule(faelle[2])).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261231');
		expect(buildRrule(faelle[3])).toBe('RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=10');
	});

	it('liefert für "nie" null', () => {
		expect(buildRrule(LEERE_REGEL)).toBeNull();
		expect(parseRrule(null)).toEqual(LEERE_REGEL);
	});
});

describe('formatRecurrence', () => {
	it('beschreibt Intervall, Wochentage und Ende auf Deutsch', () => {
		expect(formatRecurrence('RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU')).toBe('alle 2 Wochen, Di');
		expect(formatRecurrence('RRULE:FREQ=MONTHLY;UNTIL=20261231')).toBe('monatlich bis 31.12.2026');
		expect(formatRecurrence(null)).toBe('einmalig');
	});
});
