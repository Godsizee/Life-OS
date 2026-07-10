// Epley-Formel zur Schätzung des Einwiederholungsmaximums (1RM).
// 1RM = Gewicht × (1 + Wiederholungen / 30). Bei genau einer Wiederholung == Gewicht.

export function estimateOneRepMax(weightKg: number, reps: number): number {
	if (weightKg <= 0 || reps <= 0) return 0;
	if (reps === 1) return weightKg;
	return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export interface SetSample {
	exercise_name: string;
	reps: number;
	weight_kg: number | null;
	completed: boolean;
}

export interface ExerciseBest {
	exercise_name: string;
	weight_kg: number;
	reps: number;
	est_1rm: number;
}

/** Bestes geschätztes 1RM pro Übung aus einer Menge von Sets (nur erledigte, gewichtete Sets). */
export function bestPerExercise(sets: SetSample[]): ExerciseBest[] {
	const best = new Map<string, ExerciseBest>();
	for (const s of sets) {
		if (!s.completed || s.weight_kg === null || s.weight_kg <= 0 || s.reps <= 0) continue;
		const e1rm = estimateOneRepMax(s.weight_kg, s.reps);
		const prev = best.get(s.exercise_name);
		if (!prev || e1rm > prev.est_1rm) {
			best.set(s.exercise_name, {
				exercise_name: s.exercise_name,
				weight_kg: s.weight_kg,
				reps: s.reps,
				est_1rm: e1rm
			});
		}
	}
	return [...best.values()];
}
