import { tasksState } from '$lib/features/tasks/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { fitnessState } from '$lib/features/fitness/store.svelte';
import { calculateHabitProgress30Days } from '$lib/features/habits/streak';
import { fitnessFrequencyScore } from '$lib/features/fitness/utils/frequency';
import { goalsState } from './store.svelte';
import { milestonePercent, sumCheckins, targetPercent } from './checkins';
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

	// W8 — Zielwert-Ziel: Summe der Check-ins gegen die Zielmenge.
	if (goal.goal_type === 'target' && goal.target_value) {
		return targetPercent(goal.target_value, sumCheckins(goalsState.checkinsFor(goal.id)));
	}

	// W8 — Meilensteine: ein Ziel mit Unterzielen misst sich an deren Abschluss.
	const children = goalsState.goals.filter((g) => g.parent_id === goal.id);
	if (children.length > 0) return milestonePercent(children);

	const linkedTasks = tasksState.tasks.filter((t) => t.goal_id === goal.id);
	const linkedDone = linkedTasks.filter((t) => t.status === 'done');
	const linkedHabits = habitsState.habits.filter((h) => h.goal_id === goal.id && !h.archived);

	const items: number[] = [];
	if (linkedTasks.length > 0) {
		items.push((linkedDone.length / linkedTasks.length) * 100);
	}
	if (linkedHabits.length > 0) {
		const habitScores = linkedHabits.map((h) =>
			calculateHabitProgress30Days(h, habitsState.entriesFor(h.id))
		);
		items.push(habitScores.reduce((a, b) => a + b, 0) / habitScores.length);
	}

	return items.length > 0 ? Math.round(items.reduce((a, b) => a + b, 0) / items.length) : goal.progress;
}

/** True, wenn der manuelle Slider noch sinnvoll ist (Plan §5, Regel 5). */
export function usesManualProgress(goal: Goal): boolean {
	if (goal.goal_type !== 'standard') return false;
	if (goalsState.goals.some((g) => g.parent_id === goal.id)) return false;
	if (tasksState.tasks.some((t) => t.goal_id === goal.id)) return false;
	if (habitsState.habits.some((h) => h.goal_id === goal.id && !h.archived)) return false;
	return true;
}
