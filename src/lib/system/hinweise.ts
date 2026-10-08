import { maxHinweise } from '#lib/config/heute.js';
import { setze, wert } from '#lib/core/einstellungen.js';
import type { Hinweis } from '#lib/core/modul.js';
import { hinweisArtDefs, hinweisSchlummer } from './einstellungen/hinweise.js';
import { sammleHinweiseIn } from './hinweise-kern.js';
import { aktiveModule } from './module-aktiv.svelte.js';
import { MODULE } from './module.js';

// Schalter einmal aus den Deklarationen aller Module bauen (auch ausgeschalteter: der Wert bleibt erhalten).
const artDefs = new Map(hinweisArtDefs(MODULE).map((d) => [d.schluessel, d]));

const artAktiv = (art: string): boolean => {
	const def = artDefs.get(`hinweis.${art}.aktiv`);
	return def ? wert(def) : true;
};

/**
 * Hinweise für „Heute“: aktive Module → Art eingeschaltet → nicht zurückgestellt → wichtigste zuerst,
 * höchstens `heute.maxHinweise`. Der Modus „Leiser Tag“ kommt in P6 (`system.leiserTag`) und gilt bis dahin nie.
 */
export function sammleHinweise(jetzt: Date = new Date()): Hinweis[] {
	return sammleHinweiseIn(aktiveModule.liste, {
		jetzt,
		artAktiv,
		schlummer: wert(hinweisSchlummer),
		leiserTag: false,
		max: wert(maxHinweise)
	});
}

/** Stellt einen Hinweis bis `bis` zurück. Abgelaufene Einträge werden dabei mit aufgeräumt. */
export async function schlummere(id: string, bis: Date, jetzt: Date = new Date()): Promise<void> {
	const aktuell = wert(hinweisSchlummer);
	const rest = Object.fromEntries(
		Object.entries(aktuell).filter(([, iso]) => new Date(iso) > jetzt)
	);
	await setze(hinweisSchlummer, { ...rest, [id]: bis.toISOString() });
}

/** Schaltet die Art ab (Zugriff aus „Warum?“ und der Hinweiskarte in zwei Tipps). */
export async function schalteArtAus(art: string): Promise<void> {
	const def = artDefs.get(`hinweis.${art}.aktiv`);
	if (def) await setze(def, false);
}
