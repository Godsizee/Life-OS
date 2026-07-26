import { toISODate } from '$lib/core/date';
import type { Habit, HabitLog, HabitLogStatus, HabitSchedule } from './types';

export { toISODate };

const MAX_LOOKBACK_DAYS = 1000;
const MAX_LOOKBACK_WEEKS = 260;

/** Ein Tag einer Routine, unabhängig von der DB-Zeile — hält die Logik testbar. */
export interface HabitDay {
	/** 'yyyy-mm-dd', lokal */
	date: string;
	/** erreichter Wert; Häkchen-Routine: 1 */
	value: number | null;
	status: HabitLogStatus;
}

/** Nur die Habit-Felder, die die Logik braucht. */
export type HabitCore = Pick<Habit, 'schedule' | 'target_value'>;

export interface CompletionStats {
	done: number;
	due: number;
	/** 0–100, gerundet. Ohne fällige Tage: 100. */
	pct: number;
}

// ── Helfer ────────────────────────────────────────────────────────────────

export function toHabitDays(logs: Pick<HabitLog, 'date' | 'value' | 'status'>[]): HabitDay[] {
	return logs.map((l) => ({
		date: l.date,
		// PostgREST liefert numeric je nach Treiber als string — defensiv casten.
		value: l.value === null || l.value === undefined ? null : Number(l.value),
		status: l.status ?? 'done'
	}));
}

/** 'yyyy-mm-dd' -> lokales Date (KEIN new Date(string) — das parst UTC). */
export function fromISODate(iso: string): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, delta: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() + delta);
	return d;
}

/** Montag 00:00 der Woche, in der `date` liegt (DE-Wochenstart). */
export function startOfWeek(date: Date): Date {
	const d = startOfDay(date);
	return addDays(d, -((d.getDay() + 6) % 7));
}

function indexByDate(days: HabitDay[]): Map<string, HabitDay> {
	const map = new Map<string, HabitDay>();
	for (const d of days) map.set(d.date, d);
	return map;
}

export function targetOf(habit: HabitCore): number {
	return habit.target_value && habit.target_value > 0 ? habit.target_value : 1;
}

// ── Zustand eines einzelnen Tages ─────────────────────────────────────────

export function isDueOn(schedule: HabitSchedule, date: Date): boolean {
	if (schedule.type === 'daily') return true;
	if (schedule.type === 'weekly') return schedule.days.includes(date.getDay());
	return true; // weekly_count: jeder Tag darf aufs Wochenkonto einzahlen
}

export function isCompleted(habit: HabitCore, day: HabitDay | undefined): boolean {
	if (!day || day.status !== 'done') return false;
	return (day.value ?? 0) >= targetOf(habit);
}

export function isSkipped(day: HabitDay | undefined): boolean {
	return day?.status === 'skipped';
}

// ── Wochen-Rechnung (weekly_count) ────────────────────────────────────────

export function weekTarget(schedule: HabitSchedule): number {
	if (schedule.type === 'weekly_count') return schedule.times;
	if (schedule.type === 'weekly') return schedule.days.length;
	return 7;
}

function completedInWeek(habit: HabitCore, map: Map<string, HabitDay>, weekStart: Date): number {
	let count = 0;
	for (let i = 0; i < 7; i++) {
		if (isCompleted(habit, map.get(toISODate(addDays(weekStart, i))))) count++;
	}
	return count;
}

/** Fortschritt der laufenden Woche: { done, target } — für „2/3 diese Woche". */
export function weekProgress(
	habit: HabitCore,
	days: HabitDay[],
	today: Date = new Date()
): { done: number; target: number } {
	return {
		done: completedInWeek(habit, indexByDate(days), startOfWeek(today)),
		target: weekTarget(habit.schedule)
	};
}

// ── Streak ────────────────────────────────────────────────────────────────

/**
 * Läuft rückwärts ab heute und zählt zusammenhängende erledigte Einheiten.
 * - daily/weekly: Einheit = Tag. Nicht fällige und übersprungene Tage sind neutral.
 *   Der heutige Tag darf offen sein, ohne den Streak zu brechen.
 * - weekly_count: Einheit = Woche (Mo–So). Eine Woche zählt ab `times` erledigten
 *   Tagen; die laufende Woche bricht nie.
 *
 * Der Schedule wird rückwirkend mit seinem AKTUELLEN Wert ausgewertet; es gibt
 * keine Schedule-Historie (bewusste KISS-Vereinfachung, wie vor W5).
 */
export function calculateStreak(
	habit: HabitCore,
	days: HabitDay[],
	today: Date = new Date()
): number {
	const map = indexByDate(days);

	if (habit.schedule.type === 'weekly_count') {
		const times = habit.schedule.times;
		let cursor = startOfWeek(today);
		let streak = 0;
		for (let w = 0; w < MAX_LOOKBACK_WEEKS; w++) {
			if (completedInWeek(habit, map, cursor) >= times) streak++;
			else if (w > 0) break; // laufende Woche darf noch offen sein
			cursor = addDays(cursor, -7);
		}
		return streak;
	}

	let cursor = startOfDay(today);
	let streak = 0;
	for (let i = 0; i <= MAX_LOOKBACK_DAYS; i++) {
		const day = map.get(toISODate(cursor));
		if (isDueOn(habit.schedule, cursor) && !isSkipped(day)) {
			if (isCompleted(habit, day)) streak++;
			else if (i > 0) break; // heute darf noch offen sein
		}
		cursor = addDays(cursor, -1);
	}
	return streak;
}

/** Längste je erreichte Serie (gleiche Regeln wie `calculateStreak`). */
export function bestStreak(habit: HabitCore, days: HabitDay[], today: Date = new Date()): number {
	if (days.length === 0) return 0;
	const map = indexByDate(days);
	const firstIso = days.reduce((min, d) => (d.date < min ? d.date : min), days[0].date);

	if (habit.schedule.type === 'weekly_count') {
		const times = habit.schedule.times;
		const end = startOfWeek(today);
		let cursor = startOfWeek(fromISODate(firstIso));
		let best = 0;
		let run = 0;
		while (cursor <= end) {
			if (completedInWeek(habit, map, cursor) >= times) {
				run++;
				if (run > best) best = run;
			} else if (cursor < end) {
				run = 0; // laufende Woche bricht nicht
			}
			cursor = addDays(cursor, 7);
		}
		return best;
	}

	const end = startOfDay(today);
	let cursor = fromISODate(firstIso);
	let best = 0;
	let run = 0;
	while (cursor <= end) {
		const day = map.get(toISODate(cursor));
		if (isDueOn(habit.schedule, cursor) && !isSkipped(day)) {
			if (isCompleted(habit, day)) {
				run++;
				if (run > best) best = run;
			} else if (cursor < end) {
				run = 0;
			}
		}
		cursor = addDays(cursor, 1);
	}
	return best;
}

// ── Statistik ─────────────────────────────────────────────────────────────

/**
 * Erledigt/Soll im Fenster der letzten `windowDays` Tage (heute eingeschlossen).
 * Übersprungene Tage fallen aus dem Nenner — genau dafür gibt es Skip.
 */
export function completionRate(
	habit: HabitCore,
	days: HabitDay[],
	windowDays: number,
	today: Date = new Date()
): CompletionStats {
	const map = indexByDate(days);
	let done = 0;
	let due = 0;
	let cursor = startOfDay(today);

	if (habit.schedule.type === 'weekly_count') {
		for (let i = 0; i < windowDays; i++) {
			if (isCompleted(habit, map.get(toISODate(cursor)))) done++;
			cursor = addDays(cursor, -1);
		}
		due = habit.schedule.times * Math.max(1, Math.round(windowDays / 7));
		return { done, due, pct: due > 0 ? Math.min(100, Math.round((done / due) * 100)) : 100 };
	}

	for (let i = 0; i < windowDays; i++) {
		const day = map.get(toISODate(cursor));
		if (isDueOn(habit.schedule, cursor) && !isSkipped(day)) {
			due++;
			if (isCompleted(habit, day)) done++;
		}
		cursor = addDays(cursor, -1);
	}
	return { done, due, pct: due > 0 ? Math.round((done / due) * 100) : 100 };
}

/** Rückwärtskompatible Kurzform (Ziel-Fortschritt, Welle 5.2). */
export function calculateHabitProgress30Days(
	habit: HabitCore,
	days: HabitDay[],
	today: Date = new Date()
): number {
	return completionRate(habit, days, 30, today).pct;
}

export function totalCompleted(habit: HabitCore, days: HabitDay[]): number {
	return days.filter((d) => isCompleted(habit, d)).length;
}

/**
 * Ist die Routine heute noch offen? (fällig, nicht erledigt, nicht übersprungen;
 * bei weekly_count zusätzlich: Wochensoll noch nicht erreicht)
 */
export function isOpenToday(habit: HabitCore, days: HabitDay[], today: Date = new Date()): boolean {
	const map = indexByDate(days);
	const day = map.get(toISODate(today));
	if (isSkipped(day) || isCompleted(habit, day)) return false;
	if (habit.schedule.type === 'weekly_count') {
		return completedInWeek(habit, map, startOfWeek(today)) < habit.schedule.times;
	}
	return isDueOn(habit.schedule, today);
}

// ── Anzeige-Helfer ────────────────────────────────────────────────────────

export function streakUnit(schedule: HabitSchedule): 'day' | 'week' {
	return schedule.type === 'weekly_count' ? 'week' : 'day';
}

/** „5 Tage" / „1 Woche" — eine Quelle für alle Anzeigen. */
export function streakLabel(schedule: HabitSchedule, streak: number): string {
	if (streakUnit(schedule) === 'week') return `${streak} ${streak === 1 ? 'Woche' : 'Wochen'}`;
	return `${streak} ${streak === 1 ? 'Tag' : 'Tage'}`;
}

/** „Täglich" / „Mo, Mi, Fr" / „3× pro Woche" — für Liste und Detailseite. */
const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export function scheduleLabel(schedule: HabitSchedule): string {
	if (schedule.type === 'daily') return 'Täglich';
	if (schedule.type === 'weekly') {
		return [...schedule.days].sort((a, b) => a - b).map((d) => WEEKDAY_SHORT[d]).join(', ');
	}
	return `${schedule.times}× pro Woche`;
}
