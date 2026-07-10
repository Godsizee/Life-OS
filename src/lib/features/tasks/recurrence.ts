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

export function formatRRule(rrule: string | null): string | null {
	if (!rrule) return null;
	const upper = rrule.toUpperCase();
	if (upper.includes('FREQ=DAILY')) return 'täglich';
	if (upper.includes('FREQ=WEEKLY')) return 'wöchentlich';
	if (upper.includes('FREQ=MONTHLY')) return 'monatlich';
	return 'wiederkehrend';
}
