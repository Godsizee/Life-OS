import { tasksState } from '$lib/features/tasks/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { healthState } from '$lib/features/health/store.svelte';
import { moodState } from '$lib/features/mood/store.svelte';
import { goalsState } from '$lib/features/goals/store.svelte';
import { isDueOn } from '$lib/features/habits/streak';
import { getPomodorosForDate } from './focus-history';
import { toISODate } from '$lib/core/date';
import { getGoalProgress } from '$lib/features/goals/progress';

export interface ScoreBreakdown {
	tasks: number;
	habits: number;
	health: number;
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
	const dueHabits = activeHabits.filter((h) => isDueOn(h.schedule, date));
	const loggedDueHabits = dueHabits.filter((h) => {
		const logs = habitsState.logsFor(h.id);
		return logs.includes(dateStr);
	});
	const habitsScore =
		dueHabits.length > 0 ? (loggedDueHabits.length / dueHabits.length) * 100 : 100;

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

	// 7. Focus (5%) — liest immer aus localStorage (focus/store.svelte noch nicht implementiert)
	const poms = getPomodorosForDate(dateStr);
	const focusScore = poms > 0 ? Math.min(100, poms * 25) : 0;

	const total = Math.round(
		tasksScore * 0.25 +
		habitsScore * 0.25 +
		healthScore * 0.15 +
		moodScore * 0.1 +
		goalsScore * 0.1 +
		journalScore * 0.1 +
		focusScore * 0.05
	);

	return {
		total,
		breakdown: {
			tasks: Math.round(tasksScore),
			habits: Math.round(habitsScore),
			health: Math.round(healthScore),
			mood: Math.round(moodScore),
			goals: Math.round(goalsScore),
			journal: Math.round(journalScore),
			focus: Math.round(focusScore)
		}
	};
}
