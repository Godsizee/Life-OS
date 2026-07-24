import type { Task } from '$lib/features/tasks/types';

/** Prioritätgewichte */
const PRIORITY_WEIGHT: Record<string, number> = {
	high: 30,
	medium: 15,
	low: 0
};

/**
 * Score für "Was jetzt?" — höherer Wert = dringender.
 * Formel: priority_weight + deadline_proximity_bonus + goal_link_bonus
 */
export function scoreTask(task: Task, now: Date = new Date()): number {
	let score = PRIORITY_WEIGHT[task.priority] ?? 0;

	if (task.due_at) {
		const msUntilDue = new Date(task.due_at).getTime() - now.getTime();
		const daysUntilDue = msUntilDue / (1000 * 60 * 60 * 24);

		if (daysUntilDue < 0) {
			// Überfällig: maximaler Bonus
			score += 50;
		} else if (daysUntilDue <= 1) {
			score += 40;
		} else if (daysUntilDue <= 3) {
			score += 25;
		} else if (daysUntilDue <= 7) {
			score += 10;
		}
	}

	// Ziel-Verknüpfung = leichter Bonus (macht die Aufgabe sichtbarer)
	if (task.goal_id) {
		score += 5;
	}

	return score;
}

/** Sortiert offene Tasks nach Dringlichkeit */
export function rankTasks(tasks: Task[]): Task[] {
	const now = new Date();
	return [...tasks]
		.filter((t) => t.status !== 'done' && !t.parent_id)
		.sort((a, b) => scoreTask(b, now) - scoreTask(a, now));
}
