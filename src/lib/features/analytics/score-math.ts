import { toISODate } from '#lib/core/date.js';

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
export function scoreAverage(punkte: ScorePoint[]): {
	avg: number;
	tracked: number;
	total: number;
} {
	const werte = punkte.filter((p): p is ScorePoint & { total: number } => p.total !== null);
	return {
		avg: werte.length === 0 ? 0 : Math.round(werte.reduce((s, p) => s + p.total, 0) / werte.length),
		tracked: werte.length,
		total: punkte.length
	};
}
