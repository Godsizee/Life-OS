import { describe, expect, it } from 'vitest';
import { calculateStreak, isDueOn, toISODate } from './streak';
import type { HabitSchedule } from './types';

const daily: HabitSchedule = { type: 'daily' };
const today = new Date(2026, 5, 24);

function daysAgo(from: Date, n: number): Date {
	const d = new Date(from);
	d.setDate(d.getDate() - n);
	return d;
}

describe('isDueOn', () => {
	it('is always due for daily schedules', () => {
		expect(isDueOn(daily, today)).toBe(true);
	});

	it('only matches the configured weekday for weekly schedules', () => {
		const schedule: HabitSchedule = { type: 'weekly', days: [today.getDay()] };
		expect(isDueOn(schedule, today)).toBe(true);
		expect(isDueOn(schedule, daysAgo(today, 1))).toBe(false);
	});
});

describe('calculateStreak', () => {
	it('returns 0 when nothing was ever logged', () => {
		expect(calculateStreak(daily, [], today)).toBe(0);
	});

	it('counts consecutive logged days including today, stopping at the first gap', () => {
		const logged = [toISODate(today), toISODate(daysAgo(today, 1)), toISODate(daysAgo(today, 2))];
		expect(calculateStreak(daily, logged, today)).toBe(3);
	});

	it('does not break the streak when today is due but not logged yet', () => {
		const logged = [toISODate(daysAgo(today, 1)), toISODate(daysAgo(today, 2))];
		expect(calculateStreak(daily, logged, today)).toBe(2);
	});

	it('breaks the streak when a due day (not today) is missing', () => {
		const logged = [toISODate(today), toISODate(daysAgo(today, 2))]; // yesterday missing
		expect(calculateStreak(daily, logged, today)).toBe(1);
	});

	it('only counts scheduled weekdays for weekly habits, skipping non-due days', () => {
		const schedule: HabitSchedule = { type: 'weekly', days: [today.getDay()] };
		const logged = [toISODate(today), toISODate(daysAgo(today, 7)), toISODate(daysAgo(today, 14))];
		expect(calculateStreak(schedule, logged, today)).toBe(3);
	});

	it('weekly: due day today not logged yet does not break a prior streak', () => {
		const schedule: HabitSchedule = { type: 'weekly', days: [today.getDay()] };
		const logged = [toISODate(daysAgo(today, 7)), toISODate(daysAgo(today, 14))];
		expect(calculateStreak(schedule, logged, today)).toBe(2);
	});

	it('weekly: missing the most recent due day (not today) breaks the streak', () => {
		const yesterday = daysAgo(today, 1);
		const schedule: HabitSchedule = { type: 'weekly', days: [yesterday.getDay()] };
		const logged = [toISODate(daysAgo(yesterday, 7))];
		expect(calculateStreak(schedule, logged, today)).toBe(0);
	});
});
