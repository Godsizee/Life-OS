import type { AgendaEintrag } from '#lib/core/modul.js';
import { expandEvents } from './occurrences.js';
import type { Calendar, Event, EventOverride } from './types.js';

/** Termine des Tages (Serien aufgelöst, Ausnahmen angewandt) als Agenda-Einträge. */
export function kalenderAgenda(
	events: Event[],
	overrides: EventOverride[],
	kalender: Pick<Calendar, 'id' | 'name'>[],
	tag: Date
): AgendaEintrag[] {
	const von = new Date(tag.getFullYear(), tag.getMonth(), tag.getDate());
	const bis = new Date(tag.getFullYear(), tag.getMonth(), tag.getDate(), 23, 59, 59, 999);
	return expandEvents(events, overrides, von, bis).map((o) => {
		const start = new Date(o.start);
		const ende = new Date(o.end);
		const name = kalender.find((k) => k.id === o.event.calendar_id)?.name;
		return {
			key: `calendar:${o.key}`,
			modul: 'calendar',
			art: 'termin',
			titel: o.title,
			start,
			ende,
			dauerMin: Math.max(0, Math.round((ende.getTime() - start.getTime()) / 60_000)),
			ganztags: o.allDay,
			erledigt: false,
			href: `/calendar?event=${o.event.id}`,
			warum: name ? `Kalender „${name}“` : 'Kalender'
		};
	});
}
