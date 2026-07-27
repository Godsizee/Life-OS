// W9 Gesundheit — reine Auswertungen (Apple-Health-Muster, manuelles Tracking).
// Keine Svelte-/Store-/lucide-Abhaengigkeit, damit alles in vitest (Node) laeuft.
import { toISODate } from '$lib/core/date';
import type { HealthMetric } from './types';

export interface HealthLike {
	date: string;
	weight_kg: number | string | null;
	sleep_h: number | string | null;
	water_glasses: number | string | null;
	energy: number | string | null;
}

/** Postgres `numeric` kann als String ankommen — nie roh weiterrechnen. */
export function num(v: unknown): number | null {
	if (v === null || v === undefined || v === '') return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}

export function metricValue(entry: HealthLike, metric: HealthMetric): number | null {
	return num(entry[metric]);
}

/** Eintraege der letzten `days` Tage (heute inklusive), aufsteigend nach Datum. */
export function windowEntries(
	entries: HealthLike[],
	days: number,
	today: Date = new Date()
): HealthLike[] {
	const start = toISODate(
		new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1))
	);
	const end = toISODate(today);
	return entries
		.filter((e) => e.date >= start && e.date <= end)
		.slice()
		.sort((a, b) => a.date.localeCompare(b.date));
}

export interface SeriesPoint {
	date: string;
	label: string;
	value: number;
}

/** Punkte fuer TrendChart. Tage ohne Wert werden ausgelassen (keine Null-Luecken). */
export function metricSeries(
	entries: HealthLike[],
	metric: HealthMetric,
	days = 30,
	today: Date = new Date()
): SeriesPoint[] {
	const out: SeriesPoint[] = [];
	for (const e of windowEntries(entries, days, today)) {
		const value = metricValue(e, metric);
		if (value === null) continue;
		const [, mm, dd] = e.date.split('-');
		out.push({ date: e.date, label: `${dd}.${mm}.`, value });
	}
	return out;
}

/** Ø ueber die letzten `days` Tage; null wenn kein einziger Wert erfasst ist. */
export function metricAverage(
	entries: HealthLike[],
	metric: HealthMetric,
	days = 7,
	today: Date = new Date()
): number | null {
	let sum = 0;
	let n = 0;
	for (const e of windowEntries(entries, days, today)) {
		const v = metricValue(e, metric);
		if (v === null) continue;
		sum += v;
		n++;
	}
	return n === 0 ? null : sum / n;
}

/** Wie viele der erfassten Tage haben das Ziel erreicht (Wert >= Ziel). */
export function goalHitDays(
	entries: HealthLike[],
	metric: HealthMetric,
	goal: number,
	days = 30,
	today: Date = new Date()
): { hit: number; tracked: number } {
	let hit = 0;
	let tracked = 0;
	for (const e of windowEntries(entries, days, today)) {
		const v = metricValue(e, metric);
		if (v === null) continue;
		tracked++;
		if (goal > 0 && v >= goal) hit++;
	}
	return { hit, tracked };
}

/** 0–100 fuer Fortschrittsringe. Ohne Ziel (<=0) gibt es keinen Fortschritt. */
export function goalPercent(value: number | null, goal: number | null): number {
	if (value === null || !goal || goal <= 0) return 0;
	return Math.max(0, Math.min(100, Math.round((value / goal) * 100)));
}

export interface WeightTrend {
	first: number;
	last: number;
	/** last − first. Negativ = abgenommen. */
	delta: number;
	days: number;
}

export function weightTrend(
	entries: HealthLike[],
	days = 30,
	today: Date = new Date()
): WeightTrend | null {
	const w = windowEntries(entries, days, today).filter((e) => num(e.weight_kg) !== null);
	if (w.length < 2) return null;
	const first = num(w[0].weight_kg)!;
	const last = num(w[w.length - 1].weight_kg)!;
	return { first, last, delta: Math.round((last - first) * 10) / 10, days };
}

export function weightToGoal(current: number | null, goal: number | null): number | null {
	if (current === null || !goal) return null;
	return Math.round((current - goal) * 10) / 10;
}

export function trackedDays(
	entries: HealthLike[],
	metric: HealthMetric,
	days = 30,
	today: Date = new Date()
): number {
	return windowEntries(entries, days, today).filter((e) => metricValue(e, metric) !== null).length;
}

export function formatNumber(val: number, maxFractions = 1): string {
	return val.toLocaleString('de-DE', { maximumFractionDigits: maxFractions });
}

export function formatMetric(metric: HealthMetric, val: number | null): string {
	if (val === null) return '—';
	switch (metric) {
		case 'weight_kg': return `${formatNumber(val, 1)} kg`;
		case 'sleep_h': return `${formatNumber(val, 1)} h`;
		case 'water_glasses': return val === 1 ? '1 Glas' : `${formatNumber(val, 0)} Gläser`;
		case 'energy': return `${formatNumber(val, 0)}/5`;
	}
}
