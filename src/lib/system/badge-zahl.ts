import { toISODate } from '#lib/core/date.js';

/** Was das App-Icon zählt. Die Einstellung `benachrichtigung.badge` folgt in T606. */
export type BadgeModus = 'aus' | 'heute' | 'alles-faellig';

interface BadgeAufgabe {
	status: string;
	due_at: string | null;
}

/**
 * Zahl auf dem App-Icon: offene Aufgaben mit Frist heute (bzw. bis heute) in LOKALER Zeit.
 * `due_at` ist ein UTC-Zeitstempel — Vergleich nie per `startsWith` (Falle F7).
 */
export function badgeZahl(aufgaben: BadgeAufgabe[], heute: string, modus: BadgeModus): number {
	if (modus === 'aus') return 0;
	let n = 0;
	for (const a of aufgaben) {
		if (a.status === 'done' || !a.due_at) continue;
		const tag = toISODate(new Date(a.due_at));
		if (modus === 'heute' ? tag === heute : tag <= heute) n++;
	}
	return n;
}
