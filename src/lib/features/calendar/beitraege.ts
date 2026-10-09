import { Calendar } from '@lucide/svelte';
import { formatTagKurz, formatUhr, toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { sucheIn } from '#lib/core/suche.js';
import { kalenderAgenda } from './agenda.js';
import { calendarState } from './store.svelte.js';
import { termineVerlauf } from './timeline.js';

export const kalenderBeitraege: Pick<
	ModulManifest,
	'suche' | 'verknuepfbar' | 'timeline' | 'export' | 'agenda'
> = {
	agenda: (tag) =>
		kalenderAgenda(calendarState.events, calendarState.overrides, calendarState.calendars, tag),
	suche: (anfrage) =>
		sucheIn(
			calendarState.events,
			anfrage,
			(e) => e.title,
			(e, gewicht) => {
				const start = new Date(e.start);
				return {
					id: e.id,
					modul: 'calendar',
					titel: e.title,
					untertitel: e.all_day
						? formatTagKurz(start)
						: `${formatTagKurz(start)} · ${formatUhr(start)}`,
					href: `/calendar?event=${e.id}`,
					gewicht
				};
			}
		),
	verknuepfbar: [
		{
			typ: 'event',
			label: 'Termin',
			icon: Calendar,
			href: (id) => `/calendar?event=${id}`,
			alle: () => calendarState.events.map((e) => ({ id: e.id, titel: e.title }))
		}
	],
	timeline: (von, bis) =>
		termineVerlauf(calendarState.events, calendarState.overrides, toISODate(von), toISODate(bis)),
	export: () => ({ calendar_events: calendarState.events })
};
