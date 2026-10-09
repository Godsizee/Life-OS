import type { AgendaEintrag } from '#lib/core/modul.js';
import { formatMinutes } from '#lib/features/timetracking/stats.js';

export interface Kapazitaet {
	/** Tagesfenster minus Termine (überlappende zusammengelegt, ganztägige zählen nicht). */
	verfuegbarMin: number;
	/** Summe der Schätzungen offener Aufgaben; ohne Schätzung gilt die Standarddauer. */
	geplantMin: number;
	termineMin: number;
	ueberbucht: boolean;
	/** Klartext für die Kopfzeile: „Geplant 3 h 20 min · frei 4 h“ */
	satz: string;
}

export interface Tagesplan {
	/** `start !== null`, aufsteigend nach `start`. Ganztägige Einträge stehen vorn. */
	zeitlich: AgendaEintrag[];
	/** `start === null`, Reihenfolge: Aufgaben → Routinen → Rest. Innerhalb der Art bleibt die Eingabereihenfolge. */
	flexibel: AgendaEintrag[];
	kapazitaet: Kapazitaet;
}

export interface Tagesfenster {
	beginn: Date;
	ende: Date;
}

const MIN = 60_000;

/** Minuten der Vereinigung aller Termine, auf das Fenster beschnitten. */
function termineImFenster(eintraege: AgendaEintrag[], fenster: Tagesfenster): number {
	const von = fenster.beginn.getTime();
	const bis = fenster.ende.getTime();
	const spannen = eintraege
		.filter((e) => e.art === 'termin' && !e.ganztags && e.start && e.ende)
		.map((e) => [Math.max(von, e.start!.getTime()), Math.min(bis, e.ende!.getTime())] as const)
		.filter(([a, b]) => b > a)
		.sort((x, y) => x[0] - y[0]);
	let summe = 0;
	let aktuellBis = -Infinity;
	for (const [a, b] of spannen) {
		const start = Math.max(a, aktuellBis);
		if (b > start) summe += b - start;
		aktuellBis = Math.max(aktuellBis, b);
	}
	return Math.round(summe / MIN);
}

const REIHENFOLGE: Record<AgendaEintrag['art'], number> = {
	aufgabe: 0,
	routine: 1,
	termin: 2,
	erinnerung: 3,
	training: 4,
	fokus: 5
};

/** Mischt die Einträge der Module zu einem Tagesplan und rechnet die Kapazität (Zielbild C3). */
export function baueTagesplan(
	eintraege: AgendaEintrag[],
	fenster: Tagesfenster,
	standardDauerMin: number
): Tagesplan {
	const termineMin = termineImFenster(eintraege, fenster);
	const fensterMin = Math.max(
		0,
		Math.round((fenster.ende.getTime() - fenster.beginn.getTime()) / MIN)
	);
	const verfuegbarMin = Math.max(0, fensterMin - termineMin);

	const geplantMin = eintraege
		.filter((e) => e.art === 'aufgabe' && !e.erledigt)
		.reduce((summe, e) => summe + (e.dauerMin ?? standardDauerMin), 0);

	const zeitlich = eintraege
		.filter((e) => e.start !== null)
		.sort((a, b) => a.start!.getTime() - b.start!.getTime());
	// Stabile Sortierung nach Art: `Array.sort` ist stabil, die Eingabereihenfolge bleibt je Art erhalten.
	const flexibel = eintraege
		.filter((e) => e.start === null)
		.sort((a, b) => REIHENFOLGE[a.art] - REIHENFOLGE[b.art]);

	return {
		zeitlich,
		flexibel,
		kapazitaet: {
			verfuegbarMin,
			geplantMin,
			termineMin,
			ueberbucht: geplantMin > verfuegbarMin,
			satz: `Geplant ${formatMinutes(geplantMin)} · frei ${formatMinutes(verfuegbarMin)}`
		}
	};
}
