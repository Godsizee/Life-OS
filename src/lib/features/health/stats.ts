// W9 Gesundheit — reine Auswertungen (Apple-Health-Muster, manuelles Tracking).
// Keine Svelte-/Store-/lucide-Abhaengigkeit, damit alles in vitest (Node) laeuft.
import { toISODate } from '$lib/core/date';
import { formatWater, formatWeight } from '$lib/features/profile/units';
import type { HealthMetric } from './types';

export interface HealthLike {
	date: string;
	weight_kg: number | string | null;
	sleep_h: number | string | null;
	water_glasses: number | string | null;
	water_ml?: number | string | null;
	energy: number | string | null;
}

/** Standardgröße, wenn eine Altzeile nur water_glasses hat. Muss zum Backfill in 025 passen. */
const LEGACY_GLASS_ML = 250;

/**
 * Wassermenge einer Zeile in ml.
 * Altzeilen (vor Migration 025) tragen nur water_glasses — die werden mit der
 * Backfill-Größe hochgerechnet, damit Charts keine Lücke zeigen.
 */
export function waterMl(entry: HealthLike): number | null {
	const ml = num(entry.water_ml);
	if (ml !== null) return ml;
	const glasses = num(entry.water_glasses);
	return glasses === null ? null : glasses * LEGACY_GLASS_ML;
}

/** Postgres `numeric` kann als String ankommen — nie roh weiterrechnen. */
export function num(v: unknown): number | null {
	if (v === null || v === undefined || v === '') return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}

export function metricValue(entry: HealthLike, metric: HealthMetric): number | null {
	if (metric === 'water_ml') return waterMl(entry);
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

/** Gleitender Durchschnitt über `window` Punkte — glättet Tagesschwankungen (H-05). */
export function movingAverage(points: SeriesPoint[], window = 7): SeriesPoint[] {
	if (points.length === 0) return [];
	const out: SeriesPoint[] = [];
	for (let i = 0; i < points.length; i++) {
		const from = Math.max(0, i - window + 1);
		const slice = points.slice(from, i + 1);
		const avg = slice.reduce((s, p) => s + p.value, 0) / slice.length;
		out.push({ ...points[i], value: Math.round(avg * 100) / 100 });
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

/**
 * Fortschritt Startgewicht → Zielgewicht in Prozent (H-03).
 * Funktioniert in beide Richtungen (abnehmen wie zunehmen).
 * null, wenn kein Ziel gesetzt ist oder Start und Ziel identisch sind.
 */
export function weightGoalPercent(
	start: number | null,
	current: number | null,
	goal: number | null
): number | null {
	if (start === null || current === null || goal === null) return null;
	const spanne = start - goal;
	if (Math.abs(spanne) < 0.05) return current === goal ? 100 : null;
	const geschafft = start - current;
	return Math.max(0, Math.min(100, Math.round((geschafft / spanne) * 100)));
}

/**
 * Ø-Energie gruppiert nach Schlafdauer-Klasse (H-08).
 * Klassen: <6 h, 6–7 h, 7–8 h, >8 h. Nur Tage, an denen BEIDE Werte erfasst sind.
 */
export interface SleepEnergyBucket {
	label: string;
	avgEnergy: number;
	days: number;
}

export function sleepEnergyBuckets(entries: HealthLike[], days = 90, today = new Date()): SleepEnergyBucket[] {
	const defs = [
		{ label: 'unter 6 h', test: (h: number) => h < 6 },
		{ label: '6–7 h',     test: (h: number) => h >= 6 && h < 7 },
		{ label: '7–8 h',     test: (h: number) => h >= 7 && h < 8 },
		{ label: 'über 8 h',  test: (h: number) => h >= 8 }
	];
	const acc = defs.map(() => ({ sum: 0, n: 0 }));
	for (const e of windowEntries(entries, days, today)) {
		const h = num(e.sleep_h);
		const en = num(e.energy);
		if (h === null || en === null) continue;
		const i = defs.findIndex((d) => d.test(h));
		if (i < 0) continue;
		acc[i].sum += en;
		acc[i].n++;
	}
	return defs
		.map((d, i) => ({
			label: d.label,
			avgEnergy: acc[i].n === 0 ? 0 : Math.round((acc[i].sum / acc[i].n) * 10) / 10,
			days: acc[i].n
		}))
		.filter((b) => b.days > 0);
}

export function formatNumber(val: number, maxFractions = 1): string {
	return val.toLocaleString('de-DE', { maximumFractionDigits: maxFractions });
}

export function formatMetric(
	metric: HealthMetric,
	val: number | null,
	opts?: { waterUnit?: 'glasses' | 'ml'; glassSizeMl?: number; weightUnit?: 'kg' | 'lb' }
): string {
	if (val === null) return '—';
	switch (metric) {
		case 'weight_kg': return formatWeight(val, opts?.weightUnit ?? 'kg');
		case 'sleep_h': return `${formatNumber(val, 1)} h`;
		case 'water_ml': return formatWater(val, opts?.waterUnit ?? 'glasses', opts?.glassSizeMl);
		case 'energy': return `${formatNumber(val, 0)}/5`;
	}
}
