import { fromISODate } from '#lib/core/date.js';
import type { ScoreWert } from '#lib/core/score.js';
import { fitnessFrequencyScore } from './utils/frequency.js';
import type { WorkoutLog } from './types.js';

/** Wochenziel, anteilig über die laufende Woche gerechnet (siehe `fitnessFrequencyScore`). */
export function trainingScore(logs: WorkoutLog[], wochenziel: number, datum: string): ScoreWert {
	const tag = fromISODate(datum);
	if (!tag) return { wert: null, erklaerung: 'Ungültiges Datum.' };
	return {
		wert: fitnessFrequencyScore(logs, wochenziel, tag),
		erklaerung: `Training gegen das Wochenziel von ${wochenziel} Einheiten, anteilig über die Woche.`
	};
}

export function trainingKontext(logs: WorkoutLog[], datum: string) {
	return { workout: logs.some((l) => l.date === datum) };
}
