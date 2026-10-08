import type { Hinweis, ModulManifest } from '#lib/core/modul.js';

export interface HinweisOptionen {
	jetzt: Date;
	/** Ist die Art (`<modul>.<name>`) eingeschaltet? */
	artAktiv: (art: string) => boolean;
	/** `{ id: ISO-bis }` — bis dahin ruht der Hinweis */
	schlummer: Record<string, string>;
	/** Modus „Leiser Tag“: nur sehr wichtige Hinweise */
	leiserTag: boolean;
	/** Höchstzahl */
	max: number;
}

/** Ab dieser Priorität kommt ein Hinweis auch an einem leisen Tag durch. */
export const LEISE_AB_PRIORITAET = 90;

/**
 * Sammelt die Hinweise der übergebenen Module: Art eingeschaltet → nicht zurückgestellt →
 * (leiser Tag: nur wichtige) → wichtigste zuerst → die ersten `max`. Rein.
 * „Alles im Griff“ gibt es bewusst nicht: Ruhe ist der Normalfall.
 */
export function sammleHinweiseIn(
	module: Pick<ModulManifest, 'id' | 'hinweise'>[],
	o: HinweisOptionen
): Hinweis[] {
	const alle: Hinweis[] = [];
	for (const m of module) {
		if (!m.hinweise) continue;
		try {
			alle.push(...m.hinweise(o.jetzt));
		} catch (err) {
			// Ein kaputtes Modul darf die übrigen Hinweise nicht verdecken.
			console.error(`[hinweise] ${m.id} fehlgeschlagen`, err);
		}
	}
	return alle
		.filter((h) => o.artAktiv(h.art))
		.filter((h) => {
			const bis = o.schlummer[h.id];
			return !bis || new Date(bis) <= o.jetzt;
		})
		.filter((h) => !o.leiserTag || h.prioritaet >= LEISE_AB_PRIORITAET)
		.sort((a, b) => b.prioritaet - a.prioritaet)
		.slice(0, Math.max(0, o.max));
}
