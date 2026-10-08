import { toISODate } from '#lib/core/date.js';
import type { Hinweis } from '#lib/core/modul.js';
import { istOffen } from './status.js';
import type { Task } from './types.js';

/** Frist ist länger als so viele Tage vorbei. */
const TAGE_ZUR_FRIST = 2;
const MIN_ANZAHL = 2;

/** `tasks.frist-verpasst`: mindestens zwei offene Aufgaben liegen seit mehr als zwei Tagen über der Frist. */
export function fristVerpasst(tasks: Task[], jetzt: Date): Hinweis[] {
	const grenze = new Date(jetzt);
	grenze.setDate(grenze.getDate() - TAGE_ZUR_FRIST);
	const ueberfaellig = tasks.filter(
		(t) => istOffen(t) && !!t.due_at && new Date(t.due_at) < grenze
	);
	if (ueberfaellig.length < MIN_ANZAHL) return [];
	const beispiele = ueberfaellig
		.slice(0, 3)
		.map((t) => `„${t.title}“ (Frist ${toISODate(new Date(t.due_at!))})`);
	return [
		{
			id: 'tasks.frist-verpasst:sammel',
			art: 'tasks.frist-verpasst',
			titel: `${ueberfaellig.length} Aufgaben sind länger über der Frist`,
			text: 'Verschieben, aufteilen oder loslassen: Ein kurzer Blick auf die Liste hilft.',
			warum: {
				was: `${ueberfaellig.length} offene Aufgaben liegen mehr als ${TAGE_ZUR_FRIST} Tage über ihrer Frist.`,
				warumJetzt:
					'Ab zwei Aufgaben reicht ein Blick in die Liste nicht mehr, um den Überblick zu halten.',
				daten: beispiele,
				steuerung: [{ label: 'Diese Art Hinweis abschalten', href: '/settings#hinweise' }]
			},
			aktion: { label: 'Aufgaben ansehen', href: '/tasks' },
			prioritaet: 70
		}
	];
}
