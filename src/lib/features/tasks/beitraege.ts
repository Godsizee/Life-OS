import { CheckSquare } from '@lucide/svelte';
import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { sucheIn } from '#lib/core/suche.js';
import { istOffen } from './status.js';
import { tasksState } from './store.svelte.js';
import { aufgabenVerlauf } from './timeline.js';

/** Suche, Verknüpfbarkeit, Verlauf und Export der Aufgaben (T207). */
export const aufgabenBeitraege: Pick<
	ModulManifest,
	'suche' | 'verknuepfbar' | 'timeline' | 'export'
> = {
	suche: (anfrage) =>
		sucheIn(
			tasksState.tasks.filter(istOffen),
			anfrage,
			(t) => t.title,
			(t, gewicht) => ({
				id: t.id,
				modul: 'tasks',
				titel: t.title,
				untertitel: t.priority === 'high' ? 'Hohe Priorität' : undefined,
				href: `/tasks?task=${t.id}`,
				gewicht
			})
		),
	verknuepfbar: [
		{
			typ: 'task',
			label: 'Aufgabe',
			icon: CheckSquare,
			href: (id) => `/tasks?task=${id}`,
			alle: () => tasksState.tasks.map((t) => ({ id: t.id, titel: t.title }))
		}
	],
	timeline: (von, bis) => aufgabenVerlauf(tasksState.tasks, toISODate(von), toISODate(bis)),
	export: () => ({ tasks: tasksState.tasks, projects: tasksState.projects })
};
