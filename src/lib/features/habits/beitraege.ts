import { Repeat } from '@lucide/svelte';
import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { sucheIn } from '#lib/core/suche.js';
import { habitsState } from './store.svelte.js';
import { routinenVerlauf } from './timeline.js';

export const routinenBeitraege: Pick<
	ModulManifest,
	'suche' | 'verknuepfbar' | 'timeline' | 'export'
> = {
	suche: (anfrage) =>
		sucheIn(
			habitsState.habits.filter((h) => !h.archived),
			anfrage,
			(h) => h.name,
			(h, gewicht) => ({
				id: h.id,
				modul: 'habits',
				titel: h.name,
				href: `/habits/${h.id}`,
				gewicht
			})
		),
	verknuepfbar: [
		{
			typ: 'habit',
			label: 'Routine',
			icon: Repeat,
			href: (id) => `/habits/${id}`,
			alle: () =>
				habitsState.habits.filter((h) => !h.archived).map((h) => ({ id: h.id, titel: h.name }))
		}
	],
	timeline: (von, bis) =>
		routinenVerlauf(habitsState.logs, habitsState.habits, toISODate(von), toISODate(bis)),
	export: () => ({ habits: habitsState.habits, habit_logs: habitsState.logs })
};
