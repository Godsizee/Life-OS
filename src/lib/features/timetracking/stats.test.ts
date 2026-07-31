import { describe, expect, it } from 'vitest';
import {
	entryDate,
	focusScoreForDate,
	formatMinutes,
	minutesByDay,
	minutesByTask,
	minutesOf,
	minutesOnDate,
	minutesThisWeek,
	pomodorosOnDate,
	startOfWeek,
	type TimeEntryLike
} from './stats';
import { toISODate } from '$lib/core/date';

// Mittwoch, 24.06.2026, 10:00 lokal
const today = new Date(2026, 5, 24, 10, 0, 0);

function at(daysAgo: number, hour: number, minutes: number, extra: Partial<TimeEntryLike> = {}): TimeEntryLike {
	const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo, hour, 0, 0);
	return { started_at: d.toISOString(), duration_min: minutes, source: 'pomodoro', ...extra };
}

describe('minutesOf', () => {
	it('accepts the numeric-as-string form PostgREST can return', () => {
		expect(minutesOf({ started_at: today.toISOString(), duration_min: '25' })).toBe(25);
	});

	it('treats invalid or negative durations as zero', () => {
		expect(minutesOf({ started_at: today.toISOString(), duration_min: 'x' })).toBe(0);
		expect(minutesOf({ started_at: today.toISOString(), duration_min: -5 })).toBe(0);
	});
});

describe('entryDate', () => {
	it('uses the local calendar day, not the UTC one', () => {
		// 23:30 lokal — in UTC faellt das je nach Zone auf den Folgetag.
		const late = new Date(2026, 5, 24, 23, 30, 0);
		expect(entryDate({ started_at: late.toISOString(), duration_min: 25 })).toBe('2026-06-24');
	});
});

describe('minutesOnDate / pomodorosOnDate', () => {
	const entries = [at(0, 9, 25), at(0, 11, 25), at(1, 9, 50, { source: 'manual' })];

	it('sums only the given day', () => {
		expect(minutesOnDate(entries, toISODate(today))).toBe(50);
	});

	it('counts only pomodoro rounds', () => {
		expect(pomodorosOnDate(entries, toISODate(today))).toBe(2);
		expect(pomodorosOnDate(entries, entryDate(entries[2]))).toBe(0);
	});
});

describe('startOfWeek', () => {
	it('normalises to Monday for a Wednesday', () => {
		expect(toISODate(startOfWeek(today))).toBe('2026-06-22');
	});

	it('normalises to the previous Monday for a Sunday', () => {
		expect(toISODate(startOfWeek(new Date(2026, 5, 28)))).toBe('2026-06-22');
	});
});

describe('minutesThisWeek', () => {
	it('includes Monday but not the Sunday before', () => {
		const entries = [at(2, 9, 30), at(3, 9, 999)]; // Mo 22.06. + So 21.06.
		expect(minutesThisWeek(entries, today)).toBe(30);
	});
});

describe('minutesByDay', () => {
	it('returns one point per day with today last', () => {
		const points = minutesByDay([at(0, 9, 25), at(6, 9, 10)], 7, today);
		expect(points).toHaveLength(7);
		expect(points[6].date).toBe(toISODate(today));
		expect(points[6].value).toBe(25);
		expect(points[0].value).toBe(10);
	});

	it('fills empty days with 0', () => {
		expect(minutesByDay([], 3, today).map((p) => p.value)).toEqual([0, 0, 0]);
	});
});

describe('minutesByTask', () => {
	const entries = [
		at(0, 9, 25, { task_id: 'a' }),
		at(0, 10, 25, { task_id: 'a' }),
		at(0, 11, 30, { task_id: 'b' }),
		at(0, 12, 15, { task_id: null })
	];
	const resolve = (id: string | null) => (id === null ? 'Ohne Aufgabe' : `Task ${id}`);

	it('groups and sorts descending', () => {
		const rows = minutesByTask(entries, resolve, toISODate(today));
		expect(rows.map((r) => [r.title, r.minutes])).toEqual([
			['Task a', 50],
			['Task b', 30],
			['Ohne Aufgabe', 15]
		]);
	});

	it('respects the window and the limit', () => {
		expect(minutesByTask(entries, resolve, toISODate(today), 2)).toHaveLength(2);
		expect(minutesByTask([at(5, 9, 25, { task_id: 'a' })], resolve, toISODate(today))).toEqual([]);
	});
});

describe('formatMinutes', () => {
	it('formats minutes, full hours and mixed values', () => {
		expect(formatMinutes(0)).toBe('0 min');
		expect(formatMinutes(45)).toBe('45 min');
		expect(formatMinutes(120)).toBe('2 h');
		expect(formatMinutes(85)).toBe('1 h 25 min');
	});
});

describe('focusScoreForDate', () => {
	it('scales against the daily goal and caps at 100', () => {
		const entries = [at(0, 9, 25), at(0, 10, 25)];
		expect(focusScoreForDate(entries, toISODate(today), 100)).toBe(50);
		expect(focusScoreForDate(entries, toISODate(today), 25)).toBe(100);
	});

	it('returns 0 for a non-positive goal', () => {
		expect(focusScoreForDate([at(0, 9, 25)], toISODate(today), 0)).toBe(0);
	});
});

describe('focusScoreForDate mit eigenem Tagesziel', () => {
	it('rechnet gegen das übergebene Ziel, nicht gegen eine Konstante', () => {
		const e = [{ started_at: new Date(2026, 6, 31, 10, 0).toISOString(), duration_min: 50, source: 'pomodoro' as const }];
		expect(focusScoreForDate(e, '2026-07-31', 100)).toBe(50);
		expect(focusScoreForDate(e, '2026-07-31', 50)).toBe(100);
	});

	it('deckelt bei 100', () => {
		const e = [{ started_at: new Date(2026, 6, 31, 10, 0).toISOString(), duration_min: 500, source: 'pomodoro' as const }];
		expect(focusScoreForDate(e, '2026-07-31', 100)).toBe(100);
	});

	it('liefert 0 bei Ziel <= 0', () => {
		expect(focusScoreForDate([], '2026-07-31', 0)).toBe(0);
	});
});
