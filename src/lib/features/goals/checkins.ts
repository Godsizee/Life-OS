// W8 — reine Ableitungen für Zielwert-Ziele und die On-Track-Anzeige.
// Keine Store-/Svelte-Abhängigkeit, damit die Logik in vitest (Node) testbar ist.
import { toISODate } from '$lib/core/date';

const MS_PER_DAY = 86_400_000;

/** Minimalform eines Check-ins — hält die Auswertung von der DB-Zeile unabhängig. */
export interface CheckinLike {
	date: string;
	/** numeric aus Postgres kann als String ankommen. */
	value: number | string;
}

/** Minimalform eines Ziels für die On-Track-Rechnung. */
export interface TrackableGoal {
	created_at: string;
	target_date: string | null;
	status: 'open' | 'in_progress' | 'done';
}

/** Lokale Mitternacht eines 'yyyy-mm-dd'-Datums (nicht UTC). */
export function fromISODate(iso: string): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Ganze Kalendertage zwischen zwei Zeitpunkten (a − b), lokal gerechnet. */
export function diffDays(a: Date, b: Date): number {
	const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
	const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
	return Math.round((da - db) / MS_PER_DAY);
}

/** Wert eines Check-ins, defensiv gecastet. Ungültig/negativ -> 0. */
export function checkinValue(c: CheckinLike): number {
	const n = Number(c.value);
	return Number.isFinite(n) && n > 0 ? n : 0;
}

export function sumCheckins(list: CheckinLike[]): number {
	let sum = 0;
	for (const c of list) sum += checkinValue(c);
	return sum;
}

/** 0–100. Ohne Zielmenge (null/0) gibt es keinen ableitbaren Fortschritt -> 0. */
export function targetPercent(targetValue: number | null, sum: number): number {
	if (!targetValue || targetValue <= 0) return 0;
	return Math.max(0, Math.min(100, Math.round((sum / targetValue) * 100)));
}

export type TrackState = 'no_date' | 'done' | 'ahead' | 'on_track' | 'behind' | 'overdue';

export interface TrackResult {
	state: TrackState;
	/** Soll-Fortschritt in % (linear zwischen created_at und target_date). */
	expected: number;
	/** Ist-Fortschritt in %. */
	actual: number;
	/** Verbleibende Kalendertage bis target_date (negativ = überfällig). */
	daysLeft: number;
	label: string;
}

const TOLERANCE = 5;

/** Soll-Ist gegen das Zieldatum. Reine Ableitung — kein neues Datum, kein Job. */
export function evaluateTrack(
	goal: TrackableGoal,
	actual: number,
	today: Date = new Date()
): TrackResult {
	const clampedActual = Math.max(0, Math.min(100, Math.round(actual)));

	if (goal.status === 'done') {
		return { state: 'done', expected: 100, actual: clampedActual, daysLeft: 0, label: 'Erreicht' };
	}
	if (!goal.target_date) {
		return {
			state: 'no_date',
			expected: 0,
			actual: clampedActual,
			daysLeft: 0,
			label: 'Kein Zieldatum'
		};
	}

	const start = new Date(goal.created_at);
	const end = fromISODate(goal.target_date);
	const totalDays = diffDays(end, start);
	
	let expected = 100;
	if (totalDays > 0) {
		const elapsed = Math.max(0, Math.min(totalDays, diffDays(today, start)));
		expected = Math.round((elapsed / totalDays) * 100);
	}
	const daysLeft = diffDays(end, today);

	if (daysLeft < 0 && clampedActual < 100) {
		return {
			state: 'overdue',
			expected: 100,
			actual: clampedActual,
			daysLeft,
			label: `${Math.abs(daysLeft)} Tage überfällig`
		};
	}

	const delta = clampedActual - expected;
	if (delta >= TOLERANCE) {
		return { state: 'ahead', expected, actual: clampedActual, daysLeft, label: 'Voraus' };
	}
	if (delta >= -TOLERANCE) {
		return { state: 'on_track', expected, actual: clampedActual, daysLeft, label: 'Auf Kurs' };
	}
	return {
		state: 'behind',
		expected,
		actual: clampedActual,
		daysLeft,
		label: `${expected - clampedActual} % hinterher`
	};
}

export interface CheckinPoint {
	date: string;
	label: string;
	value: number;
}

/**
 * Kumulierter Verlauf der letzten `days` Tage (heute rechts) — direkt als Punkte
 * für TrendChart nutzbar. Check-ins VOR dem Fenster bilden den Startwert, damit die
 * Kurve den echten Gesamtstand zeigt.
 */
export function cumulativePoints(
	list: CheckinLike[],
	days = 30,
	today: Date = new Date()
): CheckinPoint[] {
	const startIso = toISODate(
		new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1))
	);
	let running = 0;
	const perDay = new Map<string, number>();
	for (const c of list) {
		if (c.date < startIso) running += checkinValue(c);
		else perDay.set(c.date, (perDay.get(c.date) ?? 0) + checkinValue(c));
	}

	const out: CheckinPoint[] = [];
	for (let i = days - 1; i >= 0; i--) {
		const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
		const iso = toISODate(d);
		running += perDay.get(iso) ?? 0;
		out.push({
			date: iso,
			label: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`,
			value: running
		});
	}
	return out;
}

/** „7 / 12 Bücher" — eine Quelle für alle Anzeigen. */
export function formatTargetProgress(
	sum: number,
	targetValue: number | null,
	unit: string | null
): string {
	const suffix = unit ? ` ${unit}` : '';
	const rounded = Math.round(sum * 100) / 100;
	if (!targetValue || targetValue <= 0) return `${rounded}${suffix}`;
	return `${rounded} / ${targetValue}${suffix}`;
}

/** Jüngstes Check-in-Datum ('yyyy-mm-dd') oder null. */
export function lastCheckinDate(list: CheckinLike[]): string | null {
	let latest: string | null = null;
	for (const c of list) if (!latest || c.date > latest) latest = c.date;
	return latest;
}

/** Tage seit dem letzten Check-in; null, wenn es noch keinen gibt. */
export function daysSinceLastCheckin(list: CheckinLike[], today: Date = new Date()): number | null {
	const latest = lastCheckinDate(list);
	return latest === null ? null : diffDays(today, fromISODate(latest));
}

/** Meilenstein-Fortschritt: erledigte Unterziele / alle Unterziele. */
export function milestonePercent(children: { status: 'open' | 'in_progress' | 'done' }[]): number {
	if (children.length === 0) return 0;
	const done = children.filter((c) => c.status === 'done').length;
	return Math.round((done / children.length) * 100);
}

/** IDs, die als Elternteil ausscheiden: das Ziel selbst und alle seine Nachfahren. */
export function verboteneEltern(
	goalId: string,
	alle: { id: string; parent_id: string | null }[]
): Set<string> {
	const raus = new Set<string>([goalId]);
	let gewachsen = true;
	while (gewachsen) {
		gewachsen = false;
		for (const g of alle) {
			if (g.parent_id && raus.has(g.parent_id) && !raus.has(g.id)) {
				raus.add(g.id);
				gewachsen = true;
			}
		}
	}
	return raus;
}

/** Kumulierte Summe je Check-in-Tag — direkt als TrendChart-Punkte nutzbar. */
export function cumulativeSeries(list: CheckinLike[]): CheckinPoint[] {
	const proTag = new Map<string, number>();
	for (const c of list) proTag.set(c.date, (proTag.get(c.date) ?? 0) + checkinValue(c));
	let summe = 0;
	return [...proTag.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([date, wert]) => {
			summe += wert;
			const parts = date.split('-');
			const mm = parts[1] ?? '01';
			const dd = parts[2] ?? '01';
			return { date, label: `${dd}.${mm}.`, value: Math.round(summe * 100) / 100 };
		});
}

/** Wie viel pro Tag noch nötig ist, um das Ziel bis target_date zu erreichen. */
export function benoetigtProTag(
	targetValue: number,
	summe: number,
	daysLeft: number
): number | null {
	if (daysLeft <= 0) return null;
	const rest = targetValue - summe;
	return rest <= 0 ? 0 : Math.round((rest / daysLeft) * 100) / 100;
}

export interface GoalTreeNode<T extends { id: string; parent_id: string | null }> {
	goal: T;
	children: GoalTreeNode<T>[];
}

/** Erstellt aus einer flachen Liste von Zielen eine Baumstruktur (Top-Level-Ziele mit ihren Unterzielen). */
export function buildGoalTree<T extends { id: string; parent_id: string | null }>(
	goals: T[]
): GoalTreeNode<T>[] {
	const nodeMap = new Map<string, GoalTreeNode<T>>();
	for (const g of goals) {
		nodeMap.set(g.id, { goal: g, children: [] });
	}
	const tree: GoalTreeNode<T>[] = [];
	for (const g of goals) {
		const node = nodeMap.get(g.id)!;
		if (g.parent_id && nodeMap.has(g.parent_id)) {
			nodeMap.get(g.parent_id)!.children.push(node);
		} else {
			tree.push(node);
		}
	}
	return tree;
}

