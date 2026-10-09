import { CheckSquare } from '@lucide/svelte';
import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { scoreBeitrag } from '#lib/core/score.js';
import { sucheIn } from '#lib/core/suche.js';
import { aufgabenAgenda } from './agenda.js';
import { fristVerpasst } from './hinweise.js';
import { istOffen } from './status.js';
import { tasksState } from './store.svelte.js';
import { aufgabenKontext, aufgabenScore } from './tag.js';
import { aufgabenVerlauf } from './timeline.js';

/** Suche, Verknüpfbarkeit, Verlauf, Export, Score, Hinweise und Tageskontext der Aufgaben. */
export const aufgabenBeitraege: Pick<
	ModulManifest,
	| 'suche'
	| 'verknuepfbar'
	| 'timeline'
	| 'export'
	| 'score'
	| 'hinweise'
	| 'hinweisArten'
	| 'tageskontext'
	| 'agenda'
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
	export: () => ({ tasks: tasksState.tasks, projects: tasksState.projects }),
	score: scoreBeitrag('Aufgaben', (datum) => aufgabenScore(tasksState.tasks, datum)),
	tageskontext: (datum) => aufgabenKontext(tasksState.tasks, datum),
	agenda: (tag) => aufgabenAgenda(tasksState.tasks, tag),
	hinweise: (jetzt) => fristVerpasst(tasksState.tasks, jetzt),
	hinweisArten: [
		{
			art: 'tasks.frist-verpasst',
			titel: 'Aufgaben sind länger über der Frist',
			bedingung: 'Mindestens zwei offene Aufgaben liegen mehr als zwei Tage über ihrer Frist.',
			standardAktiv: true
		}
	]
};
