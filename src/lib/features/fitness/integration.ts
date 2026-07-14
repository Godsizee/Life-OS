// Welle 5.3 — Fitness verbindet sich mit Habits & Goals.
// Wird nach dem Loggen eines Workouts aus dem Fitness-Store aufgerufen.
import { habitsState } from '$lib/features/habits/store.svelte';
import { goalsState } from '$lib/features/goals/store.svelte';
import { toastState } from '$lib/core/toast.svelte';
import type { ExerciseBest } from './utils/1rm';
import { fitnessFrequencyScore } from './utils/frequency';
import type { WorkoutLog } from './types';

const TRAINING_KEYWORDS =
	/(training|workout|sport|gym|fitness|kraft|übung|uebung|laufen|joggen|cardio|bewegung)/i;

/** Hakt per Namens-Konvention eine passende Trainings-Routine automatisch ab (nur hinzufügen). */
export function autoLogTrainingHabit(): string | null {
	const habit = habitsState.habits.find(
		(h) => !h.archived && TRAINING_KEYWORDS.test(h.name)
	);
	if (habit && !habitsState.isLoggedToday(habit.id)) {
		void habitsState.toggleToday(habit.id);
		toastState.success(`Routine „${habit.name}" automatisch abgehakt`);
		return habit.name;
	}
	return null;
}

/** Aktualisiert PR-Ziele (goal_type = 'pr') aus neuen Bestleistungen. */
export function applyPRsToGoals(prs: ExerciseBest[]): void {
	for (const pr of prs) {
		const matching = goalsState.goals.filter(
			(g) =>
				g.goal_type === 'pr' &&
				g.status !== 'done' &&
				g.target_exercise &&
				g.target_exercise.toLowerCase() === pr.exercise_name.toLowerCase()
		);
		for (const g of matching) {
			if (!g.target_value || g.target_value <= 0) continue;
			const progress = Math.min(100, Math.round((pr.est_1rm / g.target_value) * 100));
			if (progress > g.progress) {
				void goalsState.updateProgress(g.id, progress);
				if (progress >= 100) toastState.success(`🎯 Ziel „${g.title}" erreicht!`);
			}
		}
	}
}

/** Aktualisiert Frequenz-Ziele (goal_type = 'fitness_frequency') aus den aktuellen Workout-Logs. */
export function applyFrequencyToGoals(logs: WorkoutLog[]): void {
	const matching = goalsState.goals.filter(
		(g) => g.goal_type === 'fitness_frequency' && g.status !== 'done' && g.target_value
	);
	for (const g of matching) {
		const progress = fitnessFrequencyScore(logs, g.target_value!);
		if (progress > g.progress) {
			void goalsState.updateProgress(g.id, progress);
			if (progress >= 100) toastState.success(`🎯 Ziel „${g.title}" erreicht!`);
		}
	}
}

/** Feuert Toasts für neue persönliche Rekorde. */
export function announcePRs(prs: ExerciseBest[]): void {
	for (const pr of prs) {
		toastState.success(`🎉 Neuer PR: ${pr.exercise_name} — ${pr.est_1rm} kg (geschätztes 1RM)`);
	}
}
