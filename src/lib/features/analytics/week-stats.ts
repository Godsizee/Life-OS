// W10 — Kennzahlen des Weekly Review, extrahiert aus routes/review/+page.svelte (W-05).
// Rein: alle Daten kommen als Parameter, nichts liest direkt aus einem Store — testbar in vitest.
import { fromISODate } from '$lib/core/date';
import type { WeekWindow } from './week-window';
import type { Kennzahl } from './week-compare';
import type { Task } from '$lib/features/tasks/types';
import { completedBetween } from '$lib/features/tasks/utils';
import type { Habit } from '$lib/features/habits/types';
import { isDueOn, isCompleted, isSkipped, type HabitDay } from '$lib/features/habits/streak';
import type { WorkoutLog } from '$lib/features/fitness/types';
import type { DatedSetLog } from '$lib/features/fitness/api';
import type { MoodLike } from '$lib/features/mood/stats';
import { averageScore } from '$lib/features/mood/stats';
import type { HealthLike } from '$lib/features/health/stats';
import { metricAverage, goalHitDays } from '$lib/features/health/stats';
import type { TimeEntryLike } from '$lib/features/timetracking/stats';
import { minutesOnDate, formatMinutes } from '$lib/features/timetracking/stats';

export interface WochenQuellen {
	tasks: Task[];
	habits: Habit[];
	/** Wie tasksState.entriesFor — Tages-Log einer Routine. */
	habitDays: (habitId: string) => HabitDay[];
	workouts: WorkoutLog[];
	setLogs: DatedSetLog[];
	moods: MoodLike[];
	health: HealthLike[];
	focusEntries: TimeEntryLike[];
	waterGoalMl: number;
	lifeScores: { date: string; total: number }[];
}

interface RohWert {
	id: string;
	label: string;
	/** null = keine Daten in diesem Fenster (nicht dasselbe wie 0). */
	wert: number | null;
	format?: (v: number) => string;
	hoeherIstBesser?: boolean;
}

function habitAdherence(q: WochenQuellen, fenster: WeekWindow): number | null {
	if (q.habits.length === 0) return null;
	let summe = 0;
	for (const h of q.habits) {
		const byDate = new Map(q.habitDays(h.id).map((d) => [d.date, d]));
		let due = 0;
		let done = 0;
		for (const dateStr of fenster.dates) {
			const day = byDate.get(dateStr);
			if (isSkipped(day)) continue;
			if (isDueOn(h.schedule, fromISODate(dateStr)!)) {
				due++;
				if (isCompleted(h, day)) done++;
			}
		}
		summe += due > 0 ? (done / due) * 100 : 100;
	}
	return Math.round(summe / q.habits.length);
}

function trainingsvolumen(q: WochenQuellen, von: string, bis: string): number {
	return Math.round(
		q.setLogs
			.filter((s) => s.date >= von && s.date <= bis && s.set_type !== 'warmup' && s.weight_kg && s.reps)
			.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)
	);
}

function rohWerte(q: WochenQuellen, fenster: WeekWindow): RohWert[] {
	const von = fenster.dates[0];
	const bis = fenster.dates[fenster.dates.length - 1];
	const tage = fenster.dates.length;

	const wasser = goalHitDays(q.health, 'water_ml', q.waterGoalMl, tage, fenster.end);
	const scores = q.lifeScores.filter((s) => s.date >= von && s.date <= bis);

	return [
		{ id: 'tasks', label: 'Erledigte Aufgaben', wert: completedBetween(q.tasks, von, bis).length },
		{
			id: 'habits',
			label: 'Routinen-Adhärenz',
			wert: habitAdherence(q, fenster),
			format: (v) => `${v} %`
		},
		{
			id: 'workouts',
			label: 'Workouts',
			wert: new Set(q.workouts.filter((w) => w.date >= von && w.date <= bis).map((w) => w.date)).size
		},
		{
			id: 'volume',
			label: 'Trainingsvolumen',
			wert: trainingsvolumen(q, von, bis),
			format: (v) => `${v.toLocaleString('de-DE')} kg`
		},
		{
			id: 'mood',
			label: 'Ø Stimmung',
			wert: averageScore(q.moods.filter((m) => m.date >= von && m.date <= bis)),
			format: (v) => v.toFixed(1).replace('.', ','),
			hoeherIstBesser: true
		},
		{
			id: 'sleep',
			label: 'Ø Schlaf',
			wert: metricAverage(q.health, 'sleep_h', tage, fenster.end),
			format: (v) => `${v.toFixed(1)} h`,
			hoeherIstBesser: true
		},
		{
			id: 'water',
			label: 'Wasser-Zieltage',
			wert: wasser.tracked > 0 ? wasser.hit : null
		},
		{
			id: 'focus',
			label: 'Fokusminuten',
			wert: fenster.dates.reduce((sum, d) => sum + minutesOnDate(q.focusEntries, d), 0),
			format: (v) => formatMinutes(v)
		},
		{
			id: 'score',
			label: 'Ø Life Score',
			wert: scores.length > 0 ? Math.round(scores.reduce((s, x) => s + x.total, 0) / scores.length) : null,
			hoeherIstBesser: true
		}
	];
}

/**
 * Kennzahlen des laufenden Fensters mit Vergleich zur Vorwoche.
 * `q` bleibt für beide Fenster dieselbe (ungefilterte) Datenquelle — gefiltert
 * wird ausschließlich über `aktuell`/`vorwoche`.
 */
export function wochenKennzahlen(q: WochenQuellen, aktuell: WeekWindow, vorwoche: WeekWindow): Kennzahl[] {
	const a = rohWerte(q, aktuell);
	const v = rohWerte(q, vorwoche);
	return a.map((r, i) => ({
		id: r.id,
		label: r.label,
		wert: r.wert ?? 0,
		vorwoche: v[i].wert,
		format: r.format,
		hoeherIstBesser: r.hoeherIstBesser
	}));
}
