import { Dumbbell } from '@lucide/svelte';
import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { scoreBeitrag } from '#lib/core/score.js';
import { sucheIn } from '#lib/core/suche.js';
import { profileState } from '#lib/features/profile/store.svelte.js';
import { trainingAgenda } from './agenda.js';
import { trainingPause } from './hinweise.js';
import { fitnessState } from './store.svelte.js';
import { trainingKontext, trainingScore } from './tag.js';
import { trainingVerlauf } from './timeline.js';

export const trainingBeitraege: Pick<
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
	export: () => ({ workout_plans: fitnessState.plans, workout_logs: fitnessState.logs }),
	score: scoreBeitrag('Training', (datum) =>
		trainingScore(fitnessState.logs, profileState.weeklyWorkoutGoal, datum)
	),
	tageskontext: (datum) => trainingKontext(fitnessState.logs, datum),
	agenda: (tag) => trainingAgenda(fitnessState.logs, profileState.weeklyWorkoutGoal, tag),
	hinweise: (jetzt) => trainingPause(fitnessState.plans, fitnessState.logs, jetzt),
	hinweisArten: [
		{
			art: 'fitness.pause',
			titel: 'Training pausiert',
			bedingung: 'Es gibt Trainingspläne, aber seit mindestens vier Tagen kein Workout.',
			standardAktiv: true
		}
	]
};
