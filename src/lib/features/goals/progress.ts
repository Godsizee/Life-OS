import { tasksState } from '$lib/features/tasks/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { fitnessState } from '$lib/features/fitness/store.svelte';
import { calculateHabitProgress30Days } from '$lib/features/habits/streak';
import { fitnessFrequencyScore } from '$lib/features/fitness/utils/frequency';
import type { Goal } from './types';

export function getGoalProgress(goal: Goal): number {
	// PR-Ziel: Fortschritt live aus dem aktuellen geschätzten 1RM der Übung.
	// Fällt auf den gespeicherten Wert zurück, wenn der Fitness-Store nicht geladen ist.
	if (goal.goal_type === 'pr' && goal.target_exercise && goal.target_value) {
		const pr = fitnessState.prFor(goal.target_exercise);
		if (pr) return Math.min(100, Math.round((pr.est_1rm / goal.target_value) * 100));
		return goal.progress;
	}

	// Frequenz-Ziel (Welle F4): Fortschritt aus tatsächlichen Workout-Logs dieser Woche.
	if (goal.goal_type === 'fitness_frequency' && goal.target_value) {
		if (fitnessState.logs.length === 0 && goal.progress > 0) return goal.progress;
		return fitnessFrequencyScore(fitnessState.logs, goal.target_value);
	}

	const linkedTasks = tasksState.tasks.filter((t) => t.goal_id === goal.id);
	const linkedDone = linkedTasks.filter((t) => t.status === 'done');
	const linkedHabits = habitsState.habits.filter((h) => h.goal_id === goal.id && !h.archived);

	const items: number[] = [];
	if (linkedTasks.length > 0) {
		items.push((linkedDone.length / linkedTasks.length) * 100);
	}
	if (linkedHabits.length > 0) {
		const habitScores = linkedHabits.map((h) => {
			const logs = habitsState.logsFor(h.id);
			return calculateHabitProgress30Days(h.schedule, logs);
		});
		const avgHabits = habitScores.reduce((a, b) => a + b, 0) / habitScores.length;
		items.push(avgHabits);
	}

	return items.length > 0 ? Math.round(items.reduce((a, b) => a + b, 0) / items.length) : goal.progress;
}
