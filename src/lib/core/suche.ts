import type { SuchTreffer } from './modul.js';
import { passung } from './text.js';

/** Treffer je Modul höchstens so viele — die Liste soll überschaubar bleiben. */
export const MAX_TREFFER_JE_MODUL = 6;

/**
 * Filtert und gewichtet `eintraege` nach `anfrage`. `text` liefert den durchsuchten Titel,
 * `bau` das fertige Ergebnis. Eine leere Anfrage liefert nichts (die Suche zeigt dann Module).
 */
export function sucheIn<T>(
	eintraege: readonly T[],
	anfrage: string,
	text: (e: T) => string,
	bau: (e: T, gewicht: number) => SuchTreffer,
	max = MAX_TREFFER_JE_MODUL
): SuchTreffer[] {
	const q = anfrage.trim();
	if (!q) return [];
	const treffer: SuchTreffer[] = [];
	for (const e of eintraege) {
		const g = passung(text(e), q);
		if (g > 0) treffer.push(bau(e, g));
	}
	return treffer.sort((a, b) => (b.gewicht ?? 0.5) - (a.gewicht ?? 0.5)).slice(0, max);
}
