// W6 — reine Auswertung über time_entries. Keine Store-/Svelte-Abhängigkeit, damit
// die Logik in vitest (Node-Umgebung) getestet werden kann.
import { toISODate } from '$lib/core/date';
import type { TimeSource } from './types';

/** Minimalform eines Eintrags — hält die Auswertung von der DB-Zeile unabhängig. */
export interface TimeEntryLike {
	started_at: string;
	/** numeric aus Postgres kann als String ankommen. */
	duration_min: number | string;
	task_id?: string | null;
	source?: TimeSource;
}

const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** Dauer in Minuten, defensiv gecastet. Ungültig/negativ -> 0. */
export function minutesOf(entry: TimeEntryLike): number {
	const n = Number(entry.duration_min);
	return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Lokales Datum des Eintrags ('yyyy-mm-dd').
 * NICHT started_at.slice(0, 10) — das ist UTC und verschiebt Abendeinträge auf den Folgetag.
 */
export function entryDate(entry: TimeEntryLike): string {
	return toISODate(new Date(entry.started_at));
}

export function minutesOnDate(entries: TimeEntryLike[], dateStr: string): number {
	let sum = 0;
	for (const e of entries) if (entryDate(e) === dateStr) sum += minutesOf(e);
	return sum;
}

/** Anzahl abgeschlossener Fokus-Runden an einem Tag. */
export function pomodorosOnDate(entries: TimeEntryLike[], dateStr: string): number {
	return entries.filter((e) => e.source === 'pomodoro' && entryDate(e) === dateStr).length;
}

/** Montag 00:00 der Woche, in der `date` liegt (DE-Wochenstart). */
export function startOfWeek(date: Date): Date {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
	return d;
}

export function minutesSince(entries: TimeEntryLike[], fromDateStr: string): number {
	let sum = 0;
	for (const e of entries) if (entryDate(e) >= fromDateStr) sum += minutesOf(e);
	return sum;
}

export function minutesThisWeek(entries: TimeEntryLike[], today: Date = new Date()): number {
	return minutesSince(entries, toISODate(startOfWeek(today)));
}

export interface DayPoint {
	date: string;
	label: string;
	value: number;
}

/** Letzte `days` Tage (heute rechts) — direkt als Punkte für TrendChart nutzbar. */
export function minutesByDay(
	entries: TimeEntryLike[],
	days = 7,
	today: Date = new Date()
): DayPoint[] {
	const out: DayPoint[] = [];
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
		const iso = toISODate(d);
		out.push({ date: iso, label: WEEKDAY_SHORT[d.getDay()], value: minutesOnDate(entries, iso) });
	}
	return out;
}

export interface TaskBucket {
	/** Task-ID oder '__none__' für Einträge ohne Aufgabe. */
	key: string;
	title: string;
	minutes: number;
}

/**
 * Fokuszeit gruppiert nach Aufgabe, ab `fromDateStr`, absteigend.
 * `resolveTitle` löst die Task-ID auf (null -> Sammelbezeichnung) — so bleibt die
 * Funktion frei von Store-Zugriffen.
 */
export function minutesByTask(
	entries: TimeEntryLike[],
	resolveTitle: (taskId: string | null) => string,
	fromDateStr: string,
	limit = 5
): TaskBucket[] {
	const buckets = new Map<string, TaskBucket>();
	for (const e of entries) {
		if (entryDate(e) < fromDateStr) continue;
		const taskId = e.task_id ?? null;
		const key = taskId ?? '__none__';
		const bucket = buckets.get(key) ?? { key, title: resolveTitle(taskId), minutes: 0 };
		bucket.minutes += minutesOf(e);
		buckets.set(key, bucket);
	}
	return [...buckets.values()]
		.filter((b) => b.minutes > 0)
		.sort((a, b) => b.minutes - a.minutes)
		.slice(0, limit);
}

/** „45 min" / „2 h" / „1 h 25 min" — eine Quelle für alle Anzeigen. */
export function formatMinutes(min: number): string {
	const total = Math.max(0, Math.round(min));
	const h = Math.floor(total / 60);
	const m = total % 60;
	if (h === 0) return `${m} min`;
	if (m === 0) return `${h} h`;
	return `${h} h ${m} min`;
}

/** 0–100 — Fokus-Anteil des Life Scores gegen das Tages-Soll. */
export function focusScoreForDate(
	entries: TimeEntryLike[],
	dateStr: string,
	goalMinutes: number
): number {
	if (goalMinutes <= 0) return 0;
	return Math.min(100, Math.round((minutesOnDate(entries, dateStr) / goalMinutes) * 100));
}
