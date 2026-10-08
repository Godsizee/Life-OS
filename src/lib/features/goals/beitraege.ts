import { Target } from '@lucide/svelte';
import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { sucheIn } from '#lib/core/suche.js';
import { goalsState } from './store.svelte.js';
import { tagebuchVerlauf, zieleVerlauf } from './timeline.js';

export const zieleBeitraege: Pick<ModulManifest, 'suche' | 'verknuepfbar' | 'timeline' | 'export'> =
	{
		suche: (anfrage) =>
			sucheIn(
				goalsState.goals.filter((g) => !g.archived),
				anfrage,
				(g) => g.title,
				(g, gewicht) => ({
					id: g.id,
					modul: 'goals',
					titel: g.title,
					href: `/goals/${g.id}`,
					gewicht
				})
			),
		verknuepfbar: [
			{
				typ: 'goal',
				label: 'Ziel',
				icon: Target,
				href: (id) => `/goals/${id}`,
				alle: () => goalsState.goals.map((g) => ({ id: g.id, titel: g.title }))
			}
		],
		timeline: (von, bis) =>
			zieleVerlauf(goalsState.goals, goalsState.checkins, toISODate(von), toISODate(bis)),
		export: () => ({ goals: goalsState.goals, goal_checkins: goalsState.checkins })
	};

/** Das Tagebuch hängt am selben Store (bis T707 trennt). */
export const tagebuchBeitraege: Pick<ModulManifest, 'timeline' | 'export'> = {
	timeline: (von, bis) =>
		tagebuchVerlauf(goalsState.journalEntries, toISODate(von), toISODate(bis)),
	export: () => ({ journal_entries: goalsState.journalEntries })
};
