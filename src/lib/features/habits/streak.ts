import { toISODate } from '$lib/core/date';
import type { HabitSchedule } from './types';

export { toISODate };

const MAX_LOOKBACK_DAYS = 1000;

export function isDueOn(schedule: HabitSchedule, date: Date): boolean {
	if (schedule.type === 'daily') return true;
	return schedule.days.includes(date.getDay());
}

/**
 * Walks backward from `today`, counting consecutive due-and-logged days.
 * Stops at the first due-but-not-logged day. Today itself never breaks the
 * streak while unlogged - it just isn't counted until it is.
 *
 * The schedule is evaluated retroactively with its *current* value; there is
 * no schedule history. A habit switched from daily to weekly will have past
 * non-matching days treated as "not due" rather than "missed" - a deliberate
 * KISS simplification.
 */
export function calculateStreak(
	schedule: HabitSchedule,
	loggedDates: string[],
	today: Date = new Date()
): number {
	const logged = new Set(loggedDates);
	const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	let streak = 0;

	if (isDueOn(schedule, cursor) && logged.has(toISODate(cursor))) {
		streak++;
	}
	cursor.setDate(cursor.getDate() - 1);

	for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
		if (isDueOn(schedule, cursor)) {
			if (!logged.has(toISODate(cursor))) break;
			streak++;
		}
		cursor.setDate(cursor.getDate() - 1);
	}

	return streak;
}

export function calculateHabitProgress30Days(
	schedule: HabitSchedule,
	loggedDates: string[],
	today: Date = new Date()
): number {
	const logged = new Set(loggedDates);
	const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	let dueCount = 0;
	let loggedCount = 0;

	for (let i = 0; i < 30; i++) {
		if (isDueOn(schedule, cursor)) {
			dueCount++;
			if (logged.has(toISODate(cursor))) {
				loggedCount++;
			}
		}
		cursor.setDate(cursor.getDate() - 1);
	}

	return dueCount > 0 ? Math.round((loggedCount / dueCount) * 100) : 100;
}
