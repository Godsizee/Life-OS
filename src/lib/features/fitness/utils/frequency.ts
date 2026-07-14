// Welle F4 — Trainingsfrequenz-Score fürs Life-Score-Fitness-Feld und Frequenz-Ziele.
import { toISODate } from '$lib/core/date';
import type { WorkoutLog } from '../types';

function mondayOf(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay(); // 0 = Sonntag … 6 = Samstag
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

/** Anzahl unterschiedlicher Trainingstage der laufenden Kalenderwoche (Mo–So). */
export function workoutsThisWeek(logs: WorkoutLog[], now: Date = new Date()): number {
	const weekStart = toISODate(mondayOf(now));
	return new Set(logs.filter((l) => l.date >= weekStart).map((l) => l.date)).size;
}

/**
 * Wochenziel-Score: zählt bis heute anteilig, damit Montag nicht automatisch 0 ist.
 * Pro-rata-Ziel = Wochenziel × vergangene Wochentage/7 (Montag = Tag 1).
 */
export function fitnessFrequencyScore(
	logs: WorkoutLog[],
	weeklyGoal: number,
	now: Date = new Date()
): number {
	if (weeklyGoal <= 0) return 100;
	const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
	const proRataGoal = (weeklyGoal * dayOfWeek) / 7;
	if (proRataGoal <= 0) return 100;
	const done = workoutsThisWeek(logs, now);
	return Math.min(100, Math.round((done / proRataGoal) * 100));
}
