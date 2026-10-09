import { toISODate, formatUhr } from '#lib/core/date.js';
import type { AgendaEintrag } from '#lib/core/modul.js';
import { istErledigt, istOffen } from './status.js';
import type { Task } from './types.js';

/** Tag (yyyy-mm-dd, lokal) eines ISO-Zeitpunkts. */
const lokalerTag = (iso: string) => toISODate(new Date(iso));

const PRIORITAET = { high: 0, medium: 1, low: 2 } as const;

/** Offene vor erledigten, dann Priorität, Frist (früheste zuerst, ohne Frist zuletzt), Position. */
function dringlichkeit(a: Task, b: Task): number {
	const erledigt = Number(istErledigt(a)) - Number(istErledigt(b));
	if (erledigt !== 0) return erledigt;
	const prio = PRIORITAET[a.priority] - PRIORITAET[b.priority];
	if (prio !== 0) return prio;
	const fa = a.due_at ? new Date(a.due_at).getTime() : Infinity;
	const fb = b.due_at ? new Date(b.due_at).getTime() : Infinity;
	if (fa !== fb) return fa < fb ? -1 : 1;
	return a.position - b.position;
}

/**
 * Aufgaben im Tagesplan: offene und heute erledigte Aufgaben, die für heute geplant sind
 * (`planned_for`), heute fällig (`due_at`, lokal) oder heute im Zeitblock liegen (`scheduled_start`).
 * Verworfene fehlen. Sortiert nach Dringlichkeit (siehe `dringlichkeit`); zeitlich liegende ordnet der Tagesplan.
 */
export function aufgabenAgenda(tasks: Task[], tag: Date): AgendaEintrag[] {
	const heute = toISODate(tag);
	const eintraege: AgendaEintrag[] = [];

	for (const t of [...tasks].sort(dringlichkeit)) {
		const geplant = t.planned_for === heute;
		const block = t.scheduled_start ? lokalerTag(t.scheduled_start) === heute : false;
		const frist = t.due_at ? lokalerTag(t.due_at) === heute : false;
		if (!geplant && !block && !frist) continue;
		const heuteErledigt =
			istErledigt(t) && !!t.completed_at && lokalerTag(t.completed_at) === heute;
		if (!istOffen(t) && !heuteErledigt) continue;

		const start = block ? new Date(t.scheduled_start!) : null;
		let warum = 'Für heute geplant';
		if (block) warum = `Zeitblock ${formatUhr(start!)}`;
		else if (!geplant && frist) {
			const f = new Date(t.due_at!);
			// 23:59 steht für „irgendwann am Tag“ (Frist ohne Uhrzeit).
			warum =
				f.getHours() === 23 && f.getMinutes() === 59
					? 'Frist heute'
					: `Frist heute ${formatUhr(f)}`;
		}

		eintraege.push({
			key: `tasks:${t.id}`,
			modul: 'tasks',
			art: 'aufgabe',
			titel: t.title,
			start,
			ende: start && t.estimate_min ? new Date(start.getTime() + t.estimate_min * 60_000) : null,
			dauerMin: t.estimate_min,
			erledigt: istErledigt(t),
			href: `/tasks?task=${t.id}`,
			warum
		});
	}
	return eintraege;
}
