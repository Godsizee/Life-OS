// Welle F3 — Übungs-Progression: erledigte Sätze einer Übung nach Trainingsdatum
// gruppiert und aggregiert (1RM/Volumen für Kraft, Distanz/Pace/Dauer für Cardio/Duration).
import { estimateOneRepMax } from './1rm';
import type { WorkoutSetLog } from '../types';

export interface ExerciseSessionStat {
	date: string;
	bestE1rm: number | null;
	volumeKg: number | null;
	totalDurationMin: number | null;
	totalDistanceKm: number | null;
	avgPaceMinPerKm: number | null;
}

/** Aufsteigend sortiert nach Datum — eine Zeile pro Trainingstag mit dieser Übung. */
export function exerciseProgression(
	sets: (WorkoutSetLog & { date: string })[]
): ExerciseSessionStat[] {
	const byDate = new Map<string, (WorkoutSetLog & { date: string })[]>();
	for (const s of sets) {
		if (!s.completed) continue;
		const list = byDate.get(s.date) ?? [];
		list.push(s);
		byDate.set(s.date, list);
	}

	const result: ExerciseSessionStat[] = [];
	for (const [date, daySets] of byDate) {
		let bestE1rm = 0;
		let volumeKg = 0;
		let hasStrength = false;
		let totalDurationMin = 0;
		let totalDistanceKm = 0;
		let hasDuration = false;
		let hasDistance = false;

		for (const s of daySets) {
			// Warmup-Sätze (F6) fließen nicht in Volumen/1RM ein (Dauer/Distanz bleiben unberührt).
			if (s.weight_kg && s.reps && s.set_type !== 'warmup') {
				hasStrength = true;
				volumeKg += s.weight_kg * s.reps;
				const e1rm = estimateOneRepMax(s.weight_kg, s.reps);
				if (e1rm > bestE1rm) bestE1rm = e1rm;
			}
			if (s.duration_min) {
				hasDuration = true;
				totalDurationMin += s.duration_min;
			}
			if (s.distance_km) {
				hasDistance = true;
				totalDistanceKm += s.distance_km;
			}
		}

		result.push({
			date,
			bestE1rm: hasStrength ? Math.round(bestE1rm * 10) / 10 : null,
			volumeKg: hasStrength ? Math.round(volumeKg) : null,
			totalDurationMin: hasDuration ? Math.round(totalDurationMin * 10) / 10 : null,
			totalDistanceKm: hasDistance ? Math.round(totalDistanceKm * 100) / 100 : null,
			avgPaceMinPerKm: hasDuration && hasDistance ? totalDurationMin / totalDistanceKm : null
		});
	}

	return result.sort((a, b) => a.date.localeCompare(b.date));
}
