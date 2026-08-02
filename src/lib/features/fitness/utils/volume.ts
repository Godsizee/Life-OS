// Welle F3 — Wochen-Volumen pro Muskelgruppe + Cardio-Wochenstatistik.
// Muskelgruppen-Zuordnung erst über exercise_id/Katalog möglich (Freitext-Sätze zählen nicht mit).
import { toISODate } from '$lib/core/date';
import type { ExerciseCatalogEntry, WorkoutSetLog } from '../types';

function mondayOf(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay(); // 0 = Sonntag … 6 = Samstag
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

const BODYWEIGHT_EQUIPMENT = ['körpergewicht', 'body weight', 'none', 'keine'];

export function isBodyweightExercise(equipment: string | null): boolean {
	const e = (equipment ?? '').trim().toLowerCase();
	return e === '' || BODYWEIGHT_EQUIPMENT.includes(e);
}

export function effectiveWeight(
	set: Pick<WorkoutSetLog, 'weight_kg' | 'exercise_type'>,
	bodyWeightKg: number | null,
	isBodyweight: boolean
): number {
	if (set.exercise_type !== 'strength') return 0;
	const w = set.weight_kg ?? 0;
	if (!isBodyweight) return w;
	return (bodyWeightKg ?? 0) + w;
}

export interface MuscleGroupVolume {
	muscleGroup: string;
	volumeKg: number;
}

/** Trainingsvolumen (Gewicht × Reps) der laufenden Kalenderwoche (Mo–So), nach Muskelgruppe. */
export function currentWeekVolumeByMuscleGroup(
	sets: (WorkoutSetLog & { date: string })[],
	catalog: ExerciseCatalogEntry[],
	bodyWeightKg: number | null = null
): MuscleGroupVolume[] {
	const weekStart = toISODate(mondayOf(new Date()));
	const catalogById = new Map(catalog.map((c) => [c.id, c]));
	const totals = new Map<string, number>();

	for (const s of sets) {
		if (s.set_type === 'warmup') continue;
		if (s.date < weekStart || !s.reps || !s.exercise_id) continue;
		const entry = catalogById.get(s.exercise_id);
		if (!entry?.muscle_group) continue;
		
		const isBW = isBodyweightExercise(entry.equipment);
		const effWeight = effectiveWeight(s, bodyWeightKg, isBW);
		if (effWeight === 0 && s.exercise_type === 'strength') continue;

		const vol = effWeight * s.reps;
		totals.set(entry.muscle_group, (totals.get(entry.muscle_group) ?? 0) + vol);
	}

	return [...totals.entries()]
		.map(([muscleGroup, volumeKg]) => ({ muscleGroup, volumeKg: Math.round(volumeKg) }))
		.sort((a, b) => b.volumeKg - a.volumeKg);
}

export interface WeeklyCardioStat {
	weekStart: string;
	distanceKm: number;
	avgPaceMinPerKm: number | null;
}

/** Strecke/Woche + Pace-Trend der letzten `weeks` Kalenderwochen, aufsteigend sortiert. */
export function weeklyCardioStats(
	sets: (WorkoutSetLog & { date: string })[],
	weeks = 8
): WeeklyCardioStat[] {
	const byWeek = new Map<string, { distance: number; duration: number }>();
	for (const s of sets) {
		if (s.exercise_type !== 'cardio' || !s.distance_km) continue;
		const weekStart = toISODate(mondayOf(new Date(s.date)));
		const cur = byWeek.get(weekStart) ?? { distance: 0, duration: 0 };
		cur.distance += s.distance_km;
		cur.duration += s.duration_min ?? 0;
		byWeek.set(weekStart, cur);
	}

	return [...byWeek.entries()]
		.map(([weekStart, v]) => ({
			weekStart,
			distanceKm: Math.round(v.distance * 10) / 10,
			avgPaceMinPerKm: v.duration > 0 && v.distance > 0 ? v.duration / v.distance : null
		}))
		.sort((a, b) => a.weekStart.localeCompare(b.weekStart))
		.slice(-weeks);
}
