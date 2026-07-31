// W9 Stimmung — reine Auswertungen (Daylio-Niveau).
// Keine Svelte-/Store-/lucide-Abhaengigkeit, damit alles in vitest (Node) laeuft.
import { fromISODate, toISODate } from '$lib/core/date';
import { isCatalogActivity } from './activities';

export interface MoodLike {
	date: string;
	score: number;
	activities?: string[] | null;
}

export const MONTH_SHORT = [
	'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
	'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
];

export const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** Score defensiv: alles ausserhalb 1..5 faellt raus. */
export function validScore(v: unknown): number | null {
	const n = Number(v);
	if (!Number.isFinite(n)) return null;
	const r = Math.round(n);
	return r >= 1 && r <= 5 ? r : null;
}

export function activitiesOf(e: MoodLike): string[] {
	return Array.isArray(e.activities)
		? e.activities.filter((a): a is string => typeof a === 'string' && a.length > 0)
		: [];
}

export function averageScore(entries: MoodLike[]): number | null {
	let sum = 0;
	let n = 0;
	for (const e of entries) {
		const s = validScore(e.score);
		if (s !== null) {
			sum += s;
			n++;
		}
	}
	return n === 0 ? null : sum / n;
}

/** Anzahl je Score; Index 0 == Score 1 … Index 4 == Score 5. */
export function moodDistribution(entries: MoodLike[]): number[] {
	const out = [0, 0, 0, 0, 0];
	for (const e of entries) {
		const s = validScore(e.score);
		if (s !== null) out[s - 1]++;
	}
	return out;
}

/** Mehrere Einträge eines Tages zu einem Tageswert zusammenfassen (Ø, gerundet 1-5). */
export function dailyAverages(entries: MoodLike[]): (MoodLike & { score: 1 | 2 | 3 | 4 | 5 })[] {
	const proTag = new Map<string, { summe: number; n: number; tags: Set<string> }>();
	for (const e of entries) {
		const s = validScore(e.score);
		if (s === null) continue;
		const acc = proTag.get(e.date) ?? { summe: 0, n: 0, tags: new Set<string>() };
		acc.summe += s;
		acc.n++;
		for (const a of activitiesOf(e)) acc.tags.add(a);
		proTag.set(e.date, acc);
	}
	return [...proTag.entries()]
		.map(([date, a]) => ({
			date,
			score: Math.max(1, Math.min(5, Math.round(a.summe / a.n))) as 1 | 2 | 3 | 4 | 5,
			activities: [...a.tags]
		}))
		.sort((a, b) => a.date.localeCompare(b.date));
}

/** Ø-Score je Tagesabschnitt (Morgen/Mittag/Abend/Nacht). Index 0: Morgen … 3: Nacht. */
export function averageByDaypart(entries: (MoodLike & { logged_at?: string })[]): (number | null)[] {
	const sums = [0, 0, 0, 0];
	const counts = [0, 0, 0, 0];
	for (const e of entries) {
		const s = validScore(e.score);
		if (s === null || !e.logged_at) continue;
		const date = new Date(e.logged_at);
		if (isNaN(date.getTime())) continue;
		const hour = date.getHours();
		let idx = 3; // Nacht
		if (hour >= 5 && hour < 12) idx = 0; // Morgen
		else if (hour >= 12 && hour < 17) idx = 1; // Mittag
		else if (hour >= 17 && hour < 23) idx = 2; // Abend

		sums[idx] += s;
		counts[idx]++;
	}
	return sums.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : null));
}

/** Ø je Wochentag; Index 0 = Montag … 6 = Sonntag. null = keine Daten. */
export function averageByWeekday(entries: MoodLike[]): (number | null)[] {
	const aggregated = dailyAverages(entries);
	const sums = [0, 0, 0, 0, 0, 0, 0];
	const counts = [0, 0, 0, 0, 0, 0, 0];
	for (const e of aggregated) {
		const s = validScore(e.score);
		const d = fromISODate(e.date);
		if (s === null || !d) continue;
		const idx = (d.getDay() + 6) % 7; // JS: 0=So -> wir wollen 0=Mo
		sums[idx] += s;
		counts[idx]++;
	}
	return sums.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : null));
}

/** Eintraege der letzten `days` Tage (heute inklusive). */
export function filterSince(
	entries: MoodLike[],
	days: number,
	today: Date = new Date()
): MoodLike[] {
	const start = toISODate(
		new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1))
	);
	const end = toISODate(today);
	return entries.filter((e) => e.date >= start && e.date <= end);
}

export function entriesInYear(entries: MoodLike[], year: number): MoodLike[] {
	const prefix = `${year}-`;
	return entries.filter((e) => e.date.startsWith(prefix));
}

/** Jahre mit mindestens einem Eintrag, absteigend. Immer inkl. `currentYear`. */
export function availableYears(entries: MoodLike[], currentYear: number): number[] {
	const years = new Set<number>([currentYear]);
	for (const e of entries) {
		const y = Number(e.date.slice(0, 4));
		if (Number.isInteger(y) && y > 1970) years.add(y);
	}
	return [...years].sort((a, b) => b - a);
}

// ── Year in Pixels ──────────────────────────────────────────────────────────

export interface PixelDay {
	date: string;
	day: number;
	score: number | null;
	future: boolean;
}

export interface PixelMonth {
	month: number;
	label: string;
	/** immer 31 Slots; null = diesen Tag hat der Monat nicht. */
	days: (PixelDay | null)[];
}

export function daysInMonth(year: number, month: number): number {
	return new Date(year, month + 1, 0).getDate();
}

/**
 * 12 Monatsspalten x 31 Tageszeilen (Daylio-Layout).
 * `today` steuert nur, welche Zellen als `future` markiert werden.
 */
export function yearPixels(
	entries: MoodLike[],
	year: number,
	today: Date = new Date()
): PixelMonth[] {
	const byDate = new Map<string, number>();
	for (const e of dailyAverages(entriesInYear(entries, year))) {
		const s = validScore(e.score);
		if (s !== null) byDate.set(e.date, s);
	}
	const todayIso = toISODate(today);

	const months: PixelMonth[] = [];
	for (let m = 0; m < 12; m++) {
		const count = daysInMonth(year, m);
		const days: (PixelDay | null)[] = [];
		for (let slot = 0; slot < 31; slot++) {
			if (slot >= count) {
				days.push(null);
				continue;
			}
			const day = slot + 1;
			const date = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			days.push({
				date,
				day,
				score: byDate.get(date) ?? null,
				future: date > todayIso
			});
		}
		months.push({ month: m, label: MONTH_SHORT[m], days });
	}
	return months;
}

// ── Aktivitaets-Statistik ───────────────────────────────────────────────────

export interface ActivityStat {
	id: string;
	/** Tage mit dieser Aktivitaet. */
	count: number;
	/** Ø-Stimmung an diesen Tagen. */
	avg: number;
	/** avg − Gesamt-Ø. Positiv = bessere Tage. */
	delta: number;
	custom: boolean;
}

/**
 * Je Aktivitaet: Haeufigkeit, Ø-Stimmung und Abweichung vom Gesamt-Ø.
 * Aktivitaeten mit weniger als `minCount` Tagen fallen raus — bei 1–2 Tagen
 * ist die Abweichung Rauschen, keine Aussage.
 * Sortierung: staerkster positiver Effekt zuerst.
 */
export function activityStats(entries: MoodLike[], minCount = 3): ActivityStat[] {
	const overall = averageScore(entries);
	if (overall === null) return [];

	const agg = new Map<string, { sum: number; count: number }>();
	for (const e of entries) {
		const s = validScore(e.score);
		if (s === null) continue;
		for (const id of new Set(activitiesOf(e))) {
			const cur = agg.get(id) ?? { sum: 0, count: 0 };
			cur.sum += s;
			cur.count++;
			agg.set(id, cur);
		}
	}

	const out: ActivityStat[] = [];
	for (const [id, { sum, count }] of agg) {
		if (count < minCount) continue;
		const avg = sum / count;
		out.push({ id, count, avg, delta: avg - overall, custom: !isCatalogActivity(id) });
	}
	return out.sort((a, b) => b.delta - a.delta || b.count - a.count || a.id.localeCompare(b.id));
}

/** Top-Aktivitaeten guter (`good`) bzw. schlechter (`bad`) Tage. */
export function topActivities(
	stats: ActivityStat[],
	kind: 'good' | 'bad',
	limit = 5
): ActivityStat[] {
	if (kind === 'good') {
		return stats.filter((s) => s.delta > 0).slice(0, limit);
	}
	return stats
		.filter((s) => s.delta < 0)
		.slice()
		.sort((a, b) => a.delta - b.delta || b.count - a.count)
		.slice(0, limit);
}

/** Haeufigste Aktivitaeten insgesamt — Reihenfolge fuer Schnellvorschlaege. */
export function mostFrequentActivities(entries: MoodLike[], limit = 8): string[] {
	const counts = new Map<string, number>();
	for (const e of entries) {
		for (const id of new Set(activitiesOf(e))) {
			counts.set(id, (counts.get(id) ?? 0) + 1);
		}
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, limit)
		.map(([id]) => id);
}

/** „+0,6" / „−1,2" — eine Quelle fuer alle Delta-Anzeigen. */
export function formatDelta(delta: number): string {
	const rounded = Math.round(delta * 10) / 10;
	const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '±';
	return `${sign}${Math.abs(rounded).toFixed(1)}`;
}

/** „3,8" — Ø-Score mit einer Nachkommastelle, deutsches Komma. */
export function formatScore(score: number | null): string {
	return score === null ? '—' : (Math.round(score * 10) / 10).toFixed(1).replace('.', ',');
}
