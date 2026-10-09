import type { AgendaEintrag } from '#lib/core/modul.js';
import type { Tagesplan } from './agenda.js';

export interface Zurueckgestellt {
	key: string;
	/** ISO-Zeitpunkt, bis zu dem der Eintrag nicht als „Jetzt“ erscheint. */
	bis: string;
}

/** „Nicht jetzt“ blendet einen Eintrag 2 Stunden lang aus. */
export const NICHT_JETZT_STUNDEN = 2;

/** Entfernt die zurückgestellten Einträge, die noch nicht abgelaufen sind (nur für die Jetzt-Wahl). */
export function ohneZurueckgestellte(
	plan: Tagesplan,
	liste: Zurueckgestellt[],
	jetzt: Date
): Tagesplan {
	const verdeckt = new Set(liste.filter((z) => new Date(z.bis) > jetzt).map((z) => z.key));
	if (verdeckt.size === 0) return plan;
	const behalten = (e: AgendaEintrag) => !verdeckt.has(e.key);
	return {
		...plan,
		zeitlich: plan.zeitlich.filter(behalten),
		flexibel: plan.flexibel.filter(behalten)
	};
}

/** Neue Liste mit dem Eintrag für die nächsten 2 Stunden; abgelaufene Einträge fallen heraus. */
export function stelleZurueck(
	liste: Zurueckgestellt[],
	key: string,
	jetzt: Date
): Zurueckgestellt[] {
	const bis = new Date(jetzt.getTime() + NICHT_JETZT_STUNDEN * 3_600_000).toISOString();
	return [...liste.filter((z) => new Date(z.bis) > jetzt && z.key !== key), { key, bis }];
}

/** Id hinter dem Präfix eines Agenda-Schlüssels (`tasks:<id>`, `habits:<id>:<datum>`). */
export function idAusKey(key: string, modul: 'tasks' | 'habits'): string | null {
	const teile = key.split(':');
	return teile[0] === modul && teile[1] ? teile[1] : null;
}

/** Wie viele Minuten der Plan über die freie Zeit hinausgeht (0, wenn nichts überbucht ist). */
export function ueberbuchtUm(plan: Tagesplan): number {
	const k = plan.kapazitaet;
	return k.ueberbucht ? k.geplantMin - k.verfuegbarMin : 0;
}
