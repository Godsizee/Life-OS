import { describe, expect, it } from 'vitest';
import {
	buildRrule,
	firstFutureOccurrence,
	formatReminder,
	isDue,
	isOnDay,
	nextOccurrence,
	offsetLabel,
	parseReminderRrule,
	reminderAtFromAnchor,
	reminderAtOnDate
} from './schedule';

describe('parseReminderRrule', () => {
	it('liest FREQ, INTERVAL und BYDAY', () => {
		expect(parseReminderRrule('RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR')).toEqual({
			freq: 'WEEKLY',
			interval: 2,
			byday: [1, 5]
		});
	});
	it('akzeptiert die Regel ohne RRULE-Präfix', () => {
		expect(parseReminderRrule('FREQ=DAILY')?.freq).toBe('DAILY');
	});
	it('gibt bei null oder unbekannter Regel null zurück', () => {
		expect(parseReminderRrule(null)).toBeNull();
		expect(parseReminderRrule('RRULE:FREQ=HOURLY')).toBeNull();
	});
});

describe('buildRrule', () => {
	it('baut täglich und wöchentlich mit Wochentagen', () => {
		expect(buildRrule({ type: 'daily' })).toBe('RRULE:FREQ=DAILY');
		expect(buildRrule({ type: 'weekly', days: [5, 1] })).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO,FR');
		expect(buildRrule({ type: 'weekly_count', times: 3 })).toBeNull();
	});
});

describe('nextOccurrence', () => {
	it('täglich springt genau einen Tag weiter und behält die Uhrzeit', () => {
		const from = new Date(2026, 6, 26, 7, 30).toISOString();
		const next = new Date(nextOccurrence(from, 'RRULE:FREQ=DAILY')!);
		expect(next.getDate()).toBe(27);
		expect(next.getHours()).toBe(7);
		expect(next.getMinutes()).toBe(30);
	});
	it('wöchentlich mit BYDAY findet den nächsten passenden Wochentag', () => {
		// 26.07.2026 ist ein Sonntag -> nächster Montag ist der 27.
		const from = new Date(2026, 6, 26, 8, 0).toISOString();
		const next = new Date(nextOccurrence(from, 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE')!);
		expect(next.getDay()).toBe(1);
		expect(next.getDate()).toBe(27);
	});
	it('ohne Regel gibt es keine Folgeausprägung', () => {
		expect(nextOccurrence(new Date().toISOString(), null)).toBeNull();
	});
});

describe('firstFutureOccurrence', () => {
	it('spult eine vergangene Serie in die Zukunft', () => {
		const now = new Date(2026, 6, 26, 12, 0);
		const past = new Date(2026, 6, 20, 7, 30).toISOString();
		const result = new Date(firstFutureOccurrence(past, 'RRULE:FREQ=DAILY', now));
		expect(result.getTime()).toBeGreaterThan(now.getTime());
		expect(result.getHours()).toBe(7);
	});
	it('lässt einen zukünftigen Zeitpunkt unverändert', () => {
		const now = new Date(2026, 6, 26, 12, 0);
		const future = new Date(2026, 6, 27, 7, 30).toISOString();
		expect(firstFutureOccurrence(future, 'RRULE:FREQ=DAILY', now)).toBe(future);
	});
});

describe('Zeitpunkt-Helfer', () => {
	it('zieht den Vorlauf von der Ankerzeit ab', () => {
		const anchor = new Date(2026, 6, 26, 18, 0).toISOString();
		const at = new Date(reminderAtFromAnchor(anchor, 30));
		expect(at.getHours()).toBe(17);
		expect(at.getMinutes()).toBe(30);
	});
	it('kombiniert Datum und Uhrzeit lokal', () => {
		const at = new Date(reminderAtOnDate('2026-07-28', '09:00'));
		expect(at.getFullYear()).toBe(2026);
		expect(at.getMonth()).toBe(6);
		expect(at.getDate()).toBe(28);
		expect(at.getHours()).toBe(9);
	});
});

describe('Anzeige & Fälligkeit', () => {
	it('beschriftet Vorlauf-Chips', () => {
		expect(offsetLabel(0)).toBe('pünktlich');
		expect(offsetLabel(30)).toBe('30 Min vorher');
		expect(offsetLabel(60)).toBe('1 Std vorher');
		expect(offsetLabel(1440)).toBe('1 Tag vorher');
	});
	it('formatiert einmalige und wiederkehrende Erinnerungen', () => {
		const at = new Date(2026, 6, 28, 9, 0).toISOString();
		expect(formatReminder({ remind_at: at, rrule: null })).toContain('28.07.2026');
		expect(formatReminder({ remind_at: at, rrule: 'RRULE:FREQ=DAILY' })).toBe('täglich um 09:00');
		expect(formatReminder({ remind_at: at, rrule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE' })).toBe(
			'wöchentlich, Mo, Mi um 09:00'
		);
	});
	it('erkennt fällige und heutige Erinnerungen', () => {
		const now = new Date(2026, 6, 26, 12, 0);
		const past = { remind_at: new Date(2026, 6, 26, 11, 0).toISOString(), active: true };
		const future = { remind_at: new Date(2026, 6, 26, 13, 0).toISOString(), active: true };
		expect(isDue(past, now)).toBe(true);
		expect(isDue(future, now)).toBe(false);
		expect(isDue({ ...past, active: false }, now)).toBe(false);
		expect(isOnDay(future, now)).toBe(true);
	});
});
