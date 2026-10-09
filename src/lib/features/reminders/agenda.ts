import { toISODate } from '#lib/core/date.js';
import type { AgendaEintrag } from '#lib/core/modul.js';
import type { Reminder } from './types.js';

/**
 * Eigene Erinnerungen (`custom`) mit Zeitpunkt am Tag. Erinnerungen an Aufgaben, Termine und
 * Routinen fehlen bewusst: Diese stehen dort schon in der Agenda ihres Moduls.
 */
export function erinnerungenAgenda(
	erinnerungen: Pick<Reminder, 'id' | 'title' | 'remind_at' | 'url' | 'entity_type'>[],
	tag: Date
): AgendaEintrag[] {
	const heute = toISODate(tag);
	return erinnerungen
		.filter((r) => r.entity_type === 'custom' && toISODate(new Date(r.remind_at)) === heute)
		.map((r) => ({
			key: `reminders:${r.id}`,
			modul: 'dashboard' as const,
			art: 'erinnerung' as const,
			titel: r.title,
			start: new Date(r.remind_at),
			ende: null,
			dauerMin: null,
			erledigt: false,
			href: r.url || '/',
			warum: 'Erinnerung'
		}));
}
