// Welle 5.7 — „Dein Monat in Zahlen": aggregiert die letzten N Tage aus allen Modulen.
import { tasksState } from '$lib/features/tasks/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { fitnessState } from '$lib/features/fitness/store.svelte';
import { goalsState } from '$lib/features/goals/store.svelte';
import { analyticsState } from './store.svelte';
import { calculateStreak, streakUnit } from '$lib/features/habits/streak';
import { toISODate } from '$lib/core/date';

export interface PeriodReport {
	days: number;
	avgScore: number;
	bestScore: number;
	tasksCompleted: number;
	workouts: number;
	journalDays: number;
	weeklyReviews: number;
	goalsDone: number;
	longestStreak: { name: string; days: number; unit: 'day' | 'week' };
	newPRs: number;
}

export function buildPeriodReport(days = 30): PeriodReport {
	const since = new Date();
	since.setDate(since.getDate() - (days - 1));
	const sinceStr = toISODate(since);

	const scores = analyticsState.scores.filter((s) => s.date >= sinceStr).map((s) => s.total);
	const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
	const bestScore = scores.length ? Math.max(...scores) : 0;

	const tasksCompleted = tasksState.tasks.filter(
		(t) => t.status === 'done' && t.updated_at >= sinceStr
	).length;

	const workouts = fitnessState.logs.filter((l) => l.date >= sinceStr).length;

	const journalDays = goalsState.journalEntries.filter((j) => j.kind === 'daily' && j.date >= sinceStr).length;

	const weeklyReviews = goalsState.journalEntries.filter((j) => j.kind === 'weekly' && j.date >= sinceStr).length;

	const goalsDone = goalsState.goals.filter(
		(g) => g.status === 'done' && g.updated_at >= sinceStr
	).length;

	let longestStreak: PeriodReport['longestStreak'] = { name: '—', days: 0, unit: 'day' };
	for (const h of habitsState.habits.filter((h) => !h.archived)) {
		const streak = calculateStreak(h, habitsState.entriesFor(h.id));
		if (streak > longestStreak.days) longestStreak = { name: h.name, days: streak, unit: streakUnit(h.schedule) };
	}

	const newPRs = fitnessState.records.filter((r) => toISODate(new Date(r.achieved_at)) >= sinceStr).length;

	return {
		days,
		avgScore,
		bestScore,
		tasksCompleted,
		workouts,
		journalDays,
		weeklyReviews,
		goalsDone,
		longestStreak,
		newPRs
	};
}
