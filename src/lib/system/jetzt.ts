import type { AgendaEintrag } from '#lib/core/modul.js';
import type { Tagesplan } from './agenda.js';

/** Etwas, das gerade läuft und nicht aus dem Tagesplan stammt (Fokus-Runde, Live-Workout). */
export type Laufend = {
	art: 'fokus' | 'training';
	titel: string;
	href: string;
	seit: Date;
} | null;

/** Ein Termin oder Zeitblock in so vielen Minuten gilt noch als „jetzt anstehend“. */
const VORLAUF_MIN = 60;
const MIN = 60_000;

export function istLaufend(x: AgendaEintrag | NonNullable<Laufend>): x is NonNullable<Laufend> {
	return 'seit' in x;
}

function endeVon(e: AgendaEintrag): Date | null {
	if (e.ende) return e.ende;
	if (e.start && e.dauerMin) return new Date(e.start.getTime() + e.dauerMin * MIN);
	return null;
}

/**
 * Der eine Eintrag für die Jetzt-Karte. Rangfolge:
 * laufende Sitzung > Eintrag, der gerade läuft > nächster zeitlicher in ≤ 60 min
 * > erste offene flexible Aufgabe > erste offene Routine > nichts.
 * Erledigte Einträge und ganztägige Termine zählen nie.
 */
export function waehleJetzt(
	plan: Tagesplan,
	laufend: Laufend,
	jetzt: Date
): AgendaEintrag | NonNullable<Laufend> | null {
	if (laufend) return laufend;

	const offen = plan.zeitlich.filter((e) => !e.erledigt && !e.ganztags);
	const gerade = offen.find((e) => {
		const ende = endeVon(e);
		return e.start! <= jetzt && ende !== null && jetzt < ende;
	});
	if (gerade) return gerade;

	const grenze = new Date(jetzt.getTime() + VORLAUF_MIN * MIN);
	const demnaechst = offen.find((e) => e.start! > jetzt && e.start! <= grenze);
	if (demnaechst) return demnaechst;

	const aufgabe = plan.flexibel.find((e) => e.art === 'aufgabe' && !e.erledigt);
	if (aufgabe) return aufgabe;

	return plan.flexibel.find((e) => e.art === 'routine' && !e.erledigt) ?? null;
}
