import type { Pause } from '#lib/core/ruhe.js';
import { fromISODate, toISODate, type HabitDay } from './streak';

const MAX_TAGE = 366;

/**
 * Füllt Pausentage ohne echten Eintrag als 'skipped' auf: Ein übersprungener Tag hält die Serie,
 * zählt aber nicht als erledigt (`streak.ts`). Echte Einträge gewinnen immer.
 */
export function mitPausen(tage: HabitDay[], pausen: Pause[]): HabitDay[] {
	if (pausen.length === 0) return tage;
	const belegt = new Set(tage.map((t) => t.date));
	const extra: HabitDay[] = [];
	for (const p of pausen) {
		if (p.von > p.bis) continue;
		const d = fromISODate(p.von);
		for (let i = 0; i < MAX_TAGE && toISODate(d) <= p.bis; i++, d.setDate(d.getDate() + 1)) {
			const iso = toISODate(d);
			if (!belegt.has(iso)) {
				extra.push({ date: iso, value: null, status: 'skipped' });
				belegt.add(iso);
			}
		}
	}
	return extra.length ? [...tage, ...extra] : tage;
}
