// Epley-Formel zur Schätzung des Einwiederholungsmaximums (1RM).
// 1RM = Gewicht × (1 + Wiederholungen / 30). Bei genau einer Wiederholung == Gewicht.

export function estimateOneRepMax(weightKg: number, reps: number): number {
	if (weightKg <= 0 || reps <= 0) return 0;
	if (reps === 1) return weightKg;
	return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export interface SetSample {
	exercise_name: string;
	reps: number | null;
	weight_kg: number | null;
	completed: boolean;
	/** Welle F6 — 'warmup' zählt nicht ins 1RM; fehlend (Alt-Daten) = Arbeitssatz. */
	set_type?: string;
	exercise_type?: string;
	exercise_id?: string | null;
}

export interface ExerciseBest {
	exercise_name: string;
	weight_kg: number;
	reps: number;
	est_1rm: number;
}

import { effectiveWeight, isBodyweightExercise } from './volume';
import type { ExerciseCatalogEntry } from '../types';

/** Bestes geschätztes 1RM pro Übung aus einer Menge von Sets (nur erledigte, gewichtete Arbeitssätze). */
export function bestPerExercise(
	sets: SetSample[],
	catalog?: ExerciseCatalogEntry[],
	bodyWeightKg: number | null = null
): ExerciseBest[] {
	const best = new Map<string, ExerciseBest>();
	const catalogById = catalog ? new Map(catalog.map((c) => [c.id, c])) : null;

	for (const s of sets) {
		if (s.set_type === 'warmup') continue;
		if (!s.completed || s.weight_kg === null) continue;
		if (s.reps === null || s.reps <= 0) continue;

		let effW = s.weight_kg;
		if (catalogById && s.exercise_type === 'strength' && s.exercise_id) {
			const entry = catalogById.get(s.exercise_id);
			if (entry) {
				effW = effectiveWeight(
					{ weight_kg: s.weight_kg, exercise_type: 'strength' },
					bodyWeightKg,
					isBodyweightExercise(entry.equipment)
				);
			}
		}

		if (effW <= 0) continue;

		const e1rm = estimateOneRepMax(effW, s.reps);
		const prev = best.get(s.exercise_name);
		if (!prev || e1rm > prev.est_1rm) {
			best.set(s.exercise_name, {
				exercise_name: s.exercise_name,
				weight_kg: effW,
				reps: s.reps,
				est_1rm: e1rm
			});
		}
	}
	return [...best.values()];
}
