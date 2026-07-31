import type { Task } from './types';

export function expandNextOccurrence(task: Task): Date | null {
	if (!task.rrule || !task.due_at) return null;
	const due = new Date(task.due_at);
	if (isNaN(due.getTime())) return null;

	const upperRrule = task.rrule.toUpperCase();
	if (upperRrule.includes('FREQ=DAILY')) {
		due.setDate(due.getDate() + 1);
		return due;
	}
	if (upperRrule.includes('FREQ=WEEKLY')) {
		due.setDate(due.getDate() + 7);
		return due;
	}
	if (upperRrule.includes('FREQ=MONTHLY')) {
		due.setMonth(due.getMonth() + 1);
		return due;
	}
	return null;
}

import { formatRecurrence } from '$lib/features/calendar/rrule';

export function formatRRule(rrule: string | null): string | null {
	if (!rrule) return null;
	return formatRecurrence(rrule);
}
