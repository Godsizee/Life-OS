import { describe, it, expect } from 'vitest';
import { expandEvents, parseRrule } from './occurrences';
import type { Event, EventOverride } from './types';

function ev(partial: Partial<Event>): Event {
	return {
		id: 'e1',
		workspace_id: 'w1',
		calendar_id: 'c1',
		title: 'Termin',
		start: '2026-08-03T09:00:00.000Z',
		end: '2026-08-03T10:00:00.000Z',
		all_day: false,
		location: null,
		rrule: null,
		attendee_ids: [],
		created_by: 'u1',
		created_at: '2026-08-01T00:00:00.000Z',
		updated_at: '2026-08-01T00:00:00.000Z',
		...partial
	};
}

const R_START = new Date('2026-08-01T00:00:00');
const R_END = new Date('2026-08-31T23:59:59');

describe('parseRrule', () => {
	it('gibt null für leere / unbekannte Regeln', () => {
		expect(parseRrule(null)).toBeNull();
		expect(parseRrule('RRULE:FREQ=YEARLY')).toBeNull();
	});
	it('liest FREQ/INTERVAL/COUNT/UNTIL/BYDAY', () => {
		const r = parseRrule('RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=5;BYDAY=MO,WE');
		expect(r?.freq).toBe('WEEKLY');
		expect(r?.interval).toBe(2);
		expect(r?.count).toBe(5);
		expect(r?.byday).toEqual([1, 3]);
	});
});

describe('expandEvents', () => {
	it('einmaliger Termin: genau eine Occurrence, wenn im Fenster', () => {
		const occ = expandEvents([ev({})], [], R_START, R_END);
		expect(occ).toHaveLength(1);
		expect(occ[0].recurring).toBe(false);
	});

	it('einmaliger Termin außerhalb des Fensters: keine Occurrence', () => {
		const occ = expandEvents([ev({ start: '2026-07-01T09:00:00Z', end: '2026-07-01T10:00:00Z' })], [], R_START, R_END);
		expect(occ).toHaveLength(0);
	});

	it('tägliche Serie: eine Occurrence pro Tag im Fenster', () => {
		const occ = expandEvents([ev({ rrule: 'RRULE:FREQ=DAILY' })], [], R_START, R_END);
		// 03.08–31.08 = 29 Tage
		expect(occ).toHaveLength(29);
		expect(occ.every((o) => o.recurring)).toBe(true);
	});

	it('wöchentliche Serie: gleicher Wochentag', () => {
		const occ = expandEvents([ev({ rrule: 'RRULE:FREQ=WEEKLY' })], [], R_START, R_END);
		// 03.08 (Mo) + 10 + 17 + 24 + 31 = 5
		expect(occ).toHaveLength(5);
	});

	it('WEEKLY BYDAY=MO,FR', () => {
		const occ = expandEvents([ev({ rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,FR' })], [], R_START, R_END);
		// Fr 07,14,21,28 + Mo 03,10,17,24,31 = 9
		expect(occ).toHaveLength(9);
	});

	it('COUNT begrenzt', () => {
		const occ = expandEvents([ev({ rrule: 'RRULE:FREQ=DAILY;COUNT=3' })], [], R_START, R_END);
		expect(occ).toHaveLength(3);
	});

	it('UNTIL begrenzt', () => {
		const occ = expandEvents([ev({ rrule: 'RRULE:FREQ=DAILY;UNTIL=20260805' })], [], R_START, R_END);
		// 03,04,05 = 3
		expect(occ).toHaveLength(3);
	});

	it('cancelled-Override entfernt genau eine Occurrence', () => {
		const overrides: EventOverride[] = [
			{
				id: 'o1', workspace_id: 'w1', event_id: 'e1', occurrence_date: '2026-08-10',
				cancelled: true, patch: {}, created_at: '', updated_at: ''
			}
		];
		const occ = expandEvents([ev({ rrule: 'RRULE:FREQ=WEEKLY' })], overrides, R_START, R_END);
		expect(occ).toHaveLength(4);
		expect(occ.some((o) => o.occurrenceDate === '2026-08-10')).toBe(false);
	});

	it('patch-Override verschiebt Titel/Zeit dieser einen Occurrence', () => {
		const overrides: EventOverride[] = [
			{
				id: 'o1', workspace_id: 'w1', event_id: 'e1', occurrence_date: '2026-08-10',
				cancelled: false,
				patch: { title: 'Verschoben', start: '2026-08-10T14:00:00.000Z', end: '2026-08-10T15:00:00.000Z' },
				created_at: '', updated_at: ''
			}
		];
		const occ = expandEvents([ev({ rrule: 'RRULE:FREQ=WEEKLY' })], overrides, R_START, R_END);
		const patched = occ.find((o) => o.occurrenceDate === '2026-08-10');
		expect(patched?.title).toBe('Verschoben');
		expect(patched?.overridden).toBe(true);
		expect(patched?.start).toBe('2026-08-10T14:00:00.000Z');
	});
});
