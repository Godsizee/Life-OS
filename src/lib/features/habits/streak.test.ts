import { describe, expect, it } from 'vitest';
import {
	bestStreak,
	calculateHabitProgress30Days,
	calculateStreak,
	completionRate,
	isCompleted,
	isDueOn,
	isOpenToday,
	scheduleLabel,
	startOfWeek,
	streakLabel,
	toISODate,
	weekProgress,
	type HabitCore,
	type HabitDay
} from './streak';
import type { HabitSchedule } from './types';

// Mittwoch, 24.06.2026
const today = new Date(2026, 5, 24);

const daily: HabitCore = { schedule: { type: 'daily' }, target_value: null };
const quantity: HabitCore = { schedule: { type: 'daily' }, target_value: 8 };

function daysAgo(from: Date, n: number): Date {
	const d = new Date(from);
	d.setDate(d.getDate() - n);
	return d;
}
/** erledigter Tag */
function done(from: Date, n: number, value = 1): HabitDay {
	return { date: toISODate(daysAgo(from, n)), value, status: 'done' };
}
/** übersprungener Tag */
function skipped(from: Date, n: number): HabitDay {
	return { date: toISODate(daysAgo(from, n)), value: 0, status: 'skipped' };
}

describe('isDueOn', () => {
	it('is always due for daily schedules', () => {
		expect(isDueOn(daily.schedule, today)).toBe(true);
	});

	it('only matches the configured weekday for weekly schedules', () => {
		const schedule: HabitSchedule = { type: 'weekly', days: [today.getDay()] };
		expect(isDueOn(schedule, today)).toBe(true);
		expect(isDueOn(schedule, daysAgo(today, 1))).toBe(false);
	});

	it('treats every day as possible for weekly_count', () => {
		expect(isDueOn({ type: 'weekly_count', times: 3 }, today)).toBe(true);
		expect(isDueOn({ type: 'weekly_count', times: 3 }, daysAgo(today, 1))).toBe(true);
	});
});

describe('isCompleted (Mengen-Routinen)', () => {
	it('needs the target value to be reached', () => {
		expect(isCompleted(quantity, { date: 'x', value: 7, status: 'done' })).toBe(false);
		expect(isCompleted(quantity, { date: 'x', value: 8, status: 'done' })).toBe(true);
		expect(isCompleted(quantity, { date: 'x', value: 9, status: 'done' })).toBe(true);
	});

	it('never counts a skipped day as completed', () => {
		expect(isCompleted(quantity, { date: 'x', value: 8, status: 'skipped' })).toBe(false);
		expect(isCompleted(daily, { date: 'x', value: 1, status: 'skipped' })).toBe(false);
	});

	it('falls back to target 1 without target_value', () => {
		expect(isCompleted(daily, { date: 'x', value: 1, status: 'done' })).toBe(true);
	});
});

describe('calculateStreak — daily/weekly (Alt-Verhalten bleibt)', () => {
	it('returns 0 when nothing was ever logged', () => {
		expect(calculateStreak(daily, [], today)).toBe(0);
	});

	it('counts consecutive logged days including today, stopping at the first gap', () => {
		expect(calculateStreak(daily, [done(today, 0), done(today, 1), done(today, 2)], today)).toBe(3);
	});

	it('does not break the streak when today is due but not logged yet', () => {
		expect(calculateStreak(daily, [done(today, 1), done(today, 2)], today)).toBe(2);
	});

	it('breaks the streak when a due day (not today) is missing', () => {
		expect(calculateStreak(daily, [done(today, 0), done(today, 2)], today)).toBe(1);
	});

	it('only counts scheduled weekdays for weekly habits', () => {
		const habit: HabitCore = { schedule: { type: 'weekly', days: [today.getDay()] }, target_value: null };
		expect(calculateStreak(habit, [done(today, 0), done(today, 7), done(today, 14)], today)).toBe(3);
	});

	it('weekly: missing the most recent due day (not today) breaks the streak', () => {
		const yesterday = daysAgo(today, 1);
		const habit: HabitCore = { schedule: { type: 'weekly', days: [yesterday.getDay()] }, target_value: null };
		expect(calculateStreak(habit, [done(today, 8)], today)).toBe(0);
	});
});

describe('calculateStreak — Skip hält den Streak', () => {
	it('bridges a skipped day instead of breaking', () => {
		const days = [done(today, 0), skipped(today, 1), done(today, 2)];
		expect(calculateStreak(daily, days, today)).toBe(2);
	});

	it('does not count the skipped day itself', () => {
		const days = [skipped(today, 0), done(today, 1)];
		expect(calculateStreak(daily, days, today)).toBe(1);
	});

	it('bridges several consecutive skipped days (Urlaub)', () => {
		const days = [done(today, 0), skipped(today, 1), skipped(today, 2), skipped(today, 3), done(today, 4)];
		expect(calculateStreak(daily, days, today)).toBe(2);
	});
});

describe('calculateStreak — Mengen-Routinen', () => {
	it('counts a day only once the target is reached', () => {
		const days = [done(today, 0, 8), done(today, 1, 4), done(today, 2, 8)];
		expect(calculateStreak(quantity, days, today)).toBe(1); // gestern nur 4/8 -> Bruch
	});

	it('lets an unfinished today pass without breaking', () => {
		const days = [done(today, 0, 3), done(today, 1, 8), done(today, 2, 8)];
		expect(calculateStreak(quantity, days, today)).toBe(2);
	});
});

describe('calculateStreak — weekly_count (Wochen statt Tage)', () => {
	const habit: HabitCore = { schedule: { type: 'weekly_count', times: 3 }, target_value: null };
	const monday = startOfWeek(today); // Mo 22.06.2026

	function onWeek(weeksBack: number, dayOffsets: number[]): HabitDay[] {
		const base = new Date(monday);
		base.setDate(base.getDate() - weeksBack * 7);
		return dayOffsets.map((o) => {
			const d = new Date(base);
			d.setDate(d.getDate() + o);
			return { date: toISODate(d), value: 1, status: 'done' as const };
		});
	}

	it('counts a week once the quota is met', () => {
		const days = [...onWeek(0, [0, 1, 2]), ...onWeek(1, [0, 2, 4])];
		expect(calculateStreak(habit, days, today)).toBe(2);
	});

	it('does not break on an unfinished current week', () => {
		const days = [...onWeek(0, [0]), ...onWeek(1, [0, 2, 4]), ...onWeek(2, [1, 3, 5])];
		expect(calculateStreak(habit, days, today)).toBe(2);
	});

	it('breaks on a past week below the quota', () => {
		const days = [...onWeek(0, [0, 1, 2]), ...onWeek(1, [0, 2]), ...onWeek(2, [1, 3, 5])];
		expect(calculateStreak(habit, days, today)).toBe(1);
	});

	it('ignores the weekday — 3 arbitrary days are enough', () => {
		expect(calculateStreak(habit, onWeek(0, [1, 4, 6]), today)).toBe(1);
	});
});

describe('bestStreak — Regressionen zu R-01', () => {
	it('bricht bei fehlenden Tagen (keine Log-Zeile)', () => {
		const habit = { schedule: { type: 'daily' } as const, target_value: null };
		const days = [
			{ date: '2026-01-01', value: 1, status: 'done' as const },
			{ date: '2026-01-02', value: 1, status: 'done' as const },
			// Lücke: 03.–05. gar nicht erfasst
			{ date: '2026-01-06', value: 1, status: 'done' as const },
			{ date: '2026-01-07', value: 1, status: 'done' as const }
		];
		expect(bestStreak(habit, days, new Date(2026, 0, 8))).toBe(2);
	});

	it('zählt bei "weekly" nur fällige Wochentage', () => {
		const habit = { schedule: { type: 'weekly' as const, days: [1, 3, 5] }, target_value: null };
		// Mo/Mi/Fr erledigt, Dienstag ohne Eintrag → darf nicht brechen
		const days = [
			{ date: '2026-01-05', value: 1, status: 'done' as const }, // Mo
			{ date: '2026-01-07', value: 1, status: 'done' as const }, // Mi
			{ date: '2026-01-09', value: 1, status: 'done' as const }  // Fr
		];
		expect(bestStreak(habit, days, new Date(2026, 0, 10))).toBe(3);
	});

	it('ist nie kleiner als der aktuelle Streak', () => {
		const habit = { schedule: { type: 'daily' } as const, target_value: null };
		const days = ['2026-01-05', '2026-01-06', '2026-01-07'].map((date) => ({ date, value: 1, status: 'done' as const }));
		const heute = new Date(2026, 0, 7);
		expect(bestStreak(habit, days, heute)).toBeGreaterThanOrEqual(calculateStreak(habit, days, heute));
	});

	it('returns 0 without logs', () => {
		expect(bestStreak(daily, [], today)).toBe(0);
	});

	it('finds the longest past run, not the current one', () => {
		const days = [done(today, 0), done(today, 3), done(today, 4), done(today, 5), done(today, 6)];
		expect(calculateStreak(daily, days, today)).toBe(1);
		expect(bestStreak(daily, days, today)).toBe(4);
	});
});

describe('completionRate', () => {
	it('is 100 when nothing is due', () => {
		const habit: HabitCore = { schedule: { type: 'weekly', days: [] as number[] }, target_value: null };
		expect(completionRate(habit, [], 30, today).pct).toBe(100);
	});

	it('drops skipped days out of the denominator', () => {
		const days = [done(today, 0), skipped(today, 1), skipped(today, 2)];
		const stats = completionRate(daily, days, 3, today);
		expect(stats).toEqual({ done: 1, due: 1, pct: 100 });
	});

	it('counts unfinished quantity days as due but not done', () => {
		const days = [done(today, 0, 8), done(today, 1, 2)];
		expect(completionRate(quantity, days, 2, today)).toEqual({ done: 1, due: 2, pct: 50 });
	});

	it('calculateHabitProgress30Days mirrors the 30-day window', () => {
		const days = [done(today, 0), done(today, 1)];
		expect(calculateHabitProgress30Days(daily, days, today)).toBe(completionRate(daily, days, 30, today).pct);
	});
});

describe('weekProgress / isOpenToday', () => {
	it('reports the current week for weekly_count', () => {
		const habit: HabitCore = { schedule: { type: 'weekly_count', times: 3 }, target_value: null };
		const monday = startOfWeek(today);
		const days: HabitDay[] = [0, 1].map((o) => {
			const d = new Date(monday);
			d.setDate(d.getDate() + o);
			return { date: toISODate(d), value: 1, status: 'done' as const };
		});
		expect(weekProgress(habit, days, today)).toEqual({ done: 2, target: 3 });
		expect(isOpenToday(habit, days, today)).toBe(true);
	});

	it('closes a weekly_count habit once the quota is reached', () => {
		const habit: HabitCore = { schedule: { type: 'weekly_count', times: 2 }, target_value: null };
		const monday = startOfWeek(today);
		const days: HabitDay[] = [0, 1].map((o) => {
			const d = new Date(monday);
			d.setDate(d.getDate() + o);
			return { date: toISODate(d), value: 1, status: 'done' as const };
		});
		expect(isOpenToday(habit, days, today)).toBe(false);
	});

	it('is not open on a skipped day', () => {
		expect(isOpenToday(daily, [skipped(today, 0)], today)).toBe(false);
	});

	it('is not open on a non-due weekday', () => {
		const habit: HabitCore = { schedule: { type: 'weekly', days: [(today.getDay() + 1) % 7] }, target_value: null };
		expect(isOpenToday(habit, [], today)).toBe(false);
	});
});

describe('Anzeige-Helfer', () => {
	it('uses weeks for weekly_count and days otherwise', () => {
		expect(streakLabel({ type: 'weekly_count', times: 3 }, 1)).toBe('1 Woche');
		expect(streakLabel({ type: 'weekly_count', times: 3 }, 4)).toBe('4 Wochen');
		expect(streakLabel({ type: 'daily' }, 1)).toBe('1 Tag');
		expect(streakLabel({ type: 'daily' }, 5)).toBe('5 Tage');
	});

	it('describes the schedule', () => {
		expect(scheduleLabel({ type: 'daily' })).toBe('Täglich');
		expect(scheduleLabel({ type: 'weekly', days: [1, 3, 5] })).toBe('Mo, Mi, Fr');
		expect(scheduleLabel({ type: 'weekly_count', times: 3 })).toBe('3× pro Woche');
	});
});
