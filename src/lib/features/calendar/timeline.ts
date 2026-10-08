import { fromISODate } from '#lib/core/date.js';
import type { TimelineEintrag } from '#lib/core/modul.js';
import { expandEvents } from './occurrences.js';
import type { Event, EventOverride } from './types.js';

/** Termine im Fenster, Wiederholungen aufgelöst. Rein. */
export function termineVerlauf(
	events: Event[],
	overrides: EventOverride[],
	von: string,
	bis: string
): TimelineEintrag[] {
	const dVon = fromISODate(von) ?? new Date(0);
	const dBis = fromISODate(bis) ?? new Date();
	return expandEvents(events, overrides, dVon, dBis)
		.filter((o) => o.occurrenceDate >= von && o.occurrenceDate <= bis)
		.map((o) => ({
			id: `event_${o.key}`,
			modul: 'calendar' as const,
			zeit: o.occurrenceDate,
			titel: `Termin: "${o.title}"`,
			href: `/calendar?event=${o.event.id}`
		}));
}
