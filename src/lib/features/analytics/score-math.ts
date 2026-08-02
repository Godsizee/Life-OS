import { toISODate } from '$lib/core/date';
import type { ScoreBreakdown } from './scoring';

export type ScoreKey = keyof ScoreBreakdown;

/**
 * Gewichtung der acht Bereiche. Summe muss 1 ergeben — die Prüfung steht im Test.
 * DIE Quelle: Berechnung und Anzeige lesen beide hier.
 */
export const SCORE_WEIGHTS: Record<ScoreKey, number> = {
	tasks:   0.22,
	habits:  0.22,
	health:  0.13,
	fitness: 0.10,
	goals:   0.10,
	journal: 0.10,
	mood:    0.08,
	focus:   0.05
};

export const SCORE_LABELS: Record<ScoreKey, string> = {
	tasks: 'Aufgaben',
	habits: 'Routinen',
	health: 'Gesundheit',
	fitness: 'Fitness',
	goals: 'Ziele',
	journal: 'Tagebuch',
	mood: 'Stimmung',
	focus: 'Fokus'
};

/** „22 %“ — für die Anzeige. */
export function weightLabel(key: ScoreKey): string {
	return `${Math.round(SCORE_WEIGHTS[key] * 100)} %`;
}

/** Gewichtete Summe eines Breakdowns. Ersetzt die handgeschriebene Formel. */
export function weightedTotal(b: ScoreBreakdown): number {
	let summe = 0;
	for (const key of Object.keys(SCORE_WEIGHTS) as ScoreKey[]) {
		summe += b[key] * SCORE_WEIGHTS[key];
	}
	return Math.round(summe);
}

export interface ScorePoint {
	date: string;
	/** null = an diesem Tag wurde kein Score erfasst. */
	total: number | null;
}

/**
 * Lückenlose Tagesreihe über `days` Tage (heute rechts).
 * Fehlende Tage kommen als null — die Sparkline zeigt sie als Unterbrechung,
 * statt sie stillschweigend zu überspringen.
 */
export function scoreSeries(
	scores: { date: string; total: number }[],
	days: number,
	today: Date = new Date()
): ScorePoint[] {
	const nachDatum = new Map(scores.map((s) => [s.date, s.total]));
	const out: ScorePoint[] = [];
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
		const iso = toISODate(d);
		out.push({ date: iso, total: nachDatum.get(iso) ?? null });
	}
	return out;
}

/** Ø über die erfassten Tage + wie viele Tage überhaupt erfasst wurden. */
export function scoreAverage(punkte: ScorePoint[]): { avg: number; tracked: number; total: number } {
	const werte = punkte.filter((p): p is ScorePoint & { total: number } => p.total !== null);
	return {
		avg: werte.length === 0 ? 0 : Math.round(werte.reduce((s, p) => s + p.total, 0) / werte.length),
		tracked: werte.length,
		total: punkte.length
	};
}
