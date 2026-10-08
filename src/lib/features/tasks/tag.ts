import { toISODate } from '#lib/core/date.js';
import type { ScoreWert } from '#lib/core/score.js';
import { istErledigt, istVerworfen } from './status.js';
import type { Task } from './types.js';

/**
 * Aufgaben, die für den Tag zählen: am Tag geplant, am Tag fällig (lokaler Kalendertag, nicht
 * `startsWith` auf den UTC-Zeitstempel, Falle F7) oder an dem Tag erledigt. Verworfenes zählt nicht.
 */
export function relevanteAufgaben(tasks: Task[], datum: string): Task[] {
	return tasks.filter((t) => {
		if (istVerworfen(t)) return false;
		const geplant = t.planned_for === datum;
		const faellig = !!t.due_at && toISODate(new Date(t.due_at)) === datum;
		const erledigt = !!t.completed_at && toISODate(new Date(t.completed_at)) === datum;
		return geplant || faellig || erledigt;
	});
}

/** Anteil erledigter Aufgaben; ohne relevante Aufgabe `null` (kein Strafpunkt, kein Gratispunkt). */
export function aufgabenScore(tasks: Task[], datum: string): ScoreWert {
	const relevant = relevanteAufgaben(tasks, datum);
	if (relevant.length === 0) {
		return { wert: null, erklaerung: 'Für diesen Tag war keine Aufgabe geplant oder fällig.' };
	}
	const erledigt = relevant.filter(istErledigt).length;
	return {
		wert: (erledigt / relevant.length) * 100,
		erklaerung: `${erledigt} von ${relevant.length} Aufgaben erledigt (am Tag geplant, fällig oder erledigt).`
	};
}

export function aufgabenKontext(tasks: Task[], datum: string) {
	const relevant = relevanteAufgaben(tasks, datum);
	return { tasks_done: relevant.filter(istErledigt).length, tasks_total: relevant.length };
}
