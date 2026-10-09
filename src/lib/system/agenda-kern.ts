import type { AgendaEintrag, ModulManifest } from '#lib/core/modul.js';
import type { Tagesfenster } from './agenda.js';

/** `HH:MM` am Tag `tag` als lokales Datum. Ungültige Angaben fallen auf `ersatz` zurück. */
function uhrzeit(tag: Date, hhmm: string, ersatz: string): Date {
	const m = /^(\d{2}):(\d{2})$/.exec(hhmm) ?? /^(\d{2}):(\d{2})$/.exec(ersatz)!;
	return new Date(tag.getFullYear(), tag.getMonth(), tag.getDate(), Number(m[1]), Number(m[2]));
}

/** Tagesfenster aus `heute.tagesbeginn` und `heute.tagesende`. Ende vor Beginn: 08:00 bis 20:00. */
export function tagesfenster(tag: Date, beginn: string, ende: string): Tagesfenster {
	const b = uhrzeit(tag, beginn, '08:00');
	const e = uhrzeit(tag, ende, '20:00');
	if (e <= b)
		return { beginn: uhrzeit(tag, '08:00', '08:00'), ende: uhrzeit(tag, '20:00', '20:00') };
	return { beginn: b, ende: e };
}

/**
 * Agenda-Beiträge aller übergebenen Module für den Tag. Ein defektes Modul darf Heute nicht
 * zum Absturz bringen: Sein Fehler wird gemeldet, die anderen Beiträge bleiben.
 */
export function sammleAgendaIn(module: ModulManifest[], tag: Date): AgendaEintrag[] {
	const eintraege: AgendaEintrag[] = [];
	for (const m of module) {
		if (!m.agenda) continue;
		try {
			eintraege.push(...m.agenda(tag));
		} catch (fehler) {
			console.error(`[agenda] ${m.id} konnte nicht beitragen`, fehler);
		}
	}
	return eintraege;
}

/** Ersetzt den allgemeinen Trainings-Eintrag durch den geplanten Trainingsplan des Tages, falls einer verknüpft ist. */
export function mitGeplantemPlan(
	eintraege: AgendaEintrag[],
	plan: { id: string; name: string } | null
): AgendaEintrag[] {
	if (!plan) return eintraege;
	return eintraege.map((e) =>
		e.key.startsWith('fitness:training:')
			? { ...e, titel: `${plan.name} starten`, href: `/fitness?startPlan=${plan.id}` }
			: e
	);
}
