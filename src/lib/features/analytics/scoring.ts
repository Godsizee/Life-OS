import { tasksState } from '$lib/features/tasks/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { healthState } from '$lib/features/health/store.svelte';
import { moodState } from '$lib/features/mood/store.svelte';
import { goalsState } from '$lib/features/goals/store.svelte';
import { fitnessState } from '$lib/features/fitness/store.svelte';
import { profileState } from '$lib/features/profile/store.svelte';
import { isDueOn, isCompleted, isSkipped } from '$lib/features/habits/streak';
import { timeTrackingState } from '$lib/features/timetracking/store.svelte';
import { focusScoreForDate } from '$lib/features/timetracking/stats';
import { toISODate } from '$lib/core/date';
import { getGoalProgress } from '$lib/features/goals/progress';
import { fitnessFrequencyScore } from '$lib/features/fitness/utils/frequency';

export interface ScoreBreakdown {
	tasks: number;
	habits: number;
	health: number;
	fitness: number;
	mood: number;
	goals: number;
	journal: number;
	focus: number;
}

export interface ScoreResult {
	total: number;
	breakdown: ScoreBreakdown;
}

export function computeLifeScore(dateStr: string): ScoreResult {
	const date = new Date(dateStr);

	// 1. Tasks (25%)
	const todaysTasks = tasksState.tasks.filter((t) => {
		const isDue = t.due_at?.startsWith(dateStr);
		const isCompletedToday = t.status === 'done' && t.updated_at?.startsWith(dateStr);
		return isDue || isCompletedToday;
	});
	const completedTasks = todaysTasks.filter((t) => t.status === 'done');
	const tasksScore =
		todaysTasks.length > 0 ? (completedTasks.length / todaysTasks.length) * 100 : 100;

	// 2. Habits (25%)
	const activeHabits = habitsState.habits.filter((h) => !h.archived);
	const relevant = activeHabits.map((h) => ({ h, days: habitsState.entriesFor(h.id) }));
	let dueCount = 0;
	let doneCount = 0;
	for (const { h, days } of relevant) {
		const day = days.find((d) => d.date === dateStr);
		if (isSkipped(day)) continue; // übersprungene fallen komplett aus Zähler und Nenner
		if (h.schedule.type === 'weekly_count' || isDueOn(h.schedule, date)) {
			dueCount++;
			if (isCompleted(h, day)) doneCount++;
		}
	}
	const habitsScore = dueCount > 0 ? (doneCount / dueCount) * 100 : 100;

	// 3. Health (15%)
	const healthEntry = healthState.entries.find((e) => e.date === dateStr);
	let healthPoints = 0;
	if (healthEntry) {
		if (healthEntry.weight_kg !== null && healthEntry.weight_kg > 0) healthPoints += 25;
		if (healthEntry.sleep_h !== null && healthEntry.sleep_h >= 7 && healthEntry.sleep_h <= 9) {
			healthPoints += 25;
		} else if (healthEntry.sleep_h !== null) {
			healthPoints += 15;
		}
		if (healthEntry.water_glasses !== null && healthEntry.water_glasses >= 8) {
			healthPoints += 25;
		} else if (healthEntry.water_glasses !== null && healthEntry.water_glasses > 0) {
			healthPoints += Math.min(25, (healthEntry.water_glasses / 8) * 25);
		}
		if (healthEntry.energy !== null && healthEntry.energy > 0) healthPoints += 25;
	}
	const healthScore = healthPoints;

	// 4. Mood (10%)
	const moodEntry = moodState.entries.find((e) => e.date === dateStr);
	const moodScore = moodEntry ? (moodEntry.score / 5) * 100 : 0;

	// 5. Goals (10%)
	const openGoals = goalsState.goals.filter((g) => g.status === 'open');
	const goalsScore =
		openGoals.length > 0
			? openGoals.reduce((sum, g) => sum + getGoalProgress(g), 0) / openGoals.length
			: 100;

	// 6. Journal (10%)
	const journalEntry = goalsState.entryForDate(dateStr);
	const journalScore = journalEntry ? 100 : 0;

	// 7. Focus (5%) — W6: aus time_entries statt localStorage; gilt damit auch für
	//    vergangene Tage und auf jedem Gerät. Tagessoll = Runden x Fokusdauer.
	const focusScore = focusScoreForDate(
		timeTrackingState.entries,
		dateStr,
		profileState.focusDailyGoalMinutes
	);

	// 8. Fitness (10%, Welle F4) — Wochenziel-Score, pro-rata über die laufende Woche.
	const fitnessScore = fitnessFrequencyScore(fitnessState.logs, profileState.weeklyWorkoutGoal, date);

	const total = Math.round(
		tasksScore * 0.22 +
		habitsScore * 0.22 +
		healthScore * 0.13 +
		fitnessScore * 0.1 +
		goalsScore * 0.1 +
		journalScore * 0.1 +
		moodScore * 0.08 +
		focusScore * 0.05
	);

	return {
		total,
		breakdown: {
			tasks: Math.round(tasksScore),
			habits: Math.round(habitsScore),
			health: Math.round(healthScore),
			fitness: Math.round(fitnessScore),
			mood: Math.round(moodScore),
			goals: Math.round(goalsScore),
			journal: Math.round(journalScore),
			focus: Math.round(focusScore)
		}
	};
}
