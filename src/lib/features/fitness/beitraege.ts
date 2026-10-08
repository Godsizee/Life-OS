import { Dumbbell } from '@lucide/svelte';
import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { sucheIn } from '#lib/core/suche.js';
import { fitnessState } from './store.svelte.js';
import { trainingVerlauf } from './timeline.js';

export const trainingBeitraege: Pick<
	ModulManifest,
	'suche' | 'verknuepfbar' | 'timeline' | 'export'
> = {
	suche: (anfrage) =>
		sucheIn(
			fitnessState.catalog,
			anfrage,
			(e) => e.name_de,
			(e, gewicht) => ({
				id: e.id,
				modul: 'fitness',
				titel: e.name_de,
				untertitel: e.muscle_group ?? undefined,
				href: `/fitness/exercise/${e.id}`,
				gewicht
			})
		),
	verknuepfbar: [
		{
			typ: 'workout_plan',
			label: 'Trainingsplan',
			icon: Dumbbell,
			href: () => '/fitness',
			alle: () => fitnessState.plans.map((p) => ({ id: p.id, titel: p.name }))
		}
	],
	timeline: (von, bis) =>
		trainingVerlauf(fitnessState.logs, fitnessState.plans, toISODate(von), toISODate(bis)),
	export: () => ({ workout_plans: fitnessState.plans, workout_logs: fitnessState.logs })
};
