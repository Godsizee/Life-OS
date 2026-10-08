import { Target } from '@lucide/svelte';
import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { scoreBeitrag } from '#lib/core/score.js';
import { sucheIn } from '#lib/core/suche.js';
import { hinterher, ohneBewegung, tagebuchHeute, tagebuchPause } from './hinweise.js';
import { getGoalProgress } from './progress.js';
import { goalsState } from './store.svelte.js';
import { tagebuchScore, zieleScore } from './tag.js';
import { tagebuchVerlauf, zieleVerlauf } from './timeline.js';

export const zieleBeitraege: Pick<
	ModulManifest,
	'suche' | 'verknuepfbar' | 'timeline' | 'export' | 'score' | 'hinweise' | 'hinweisArten'
> = {
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
	export: () => ({ goals: goalsState.goals, goal_checkins: goalsState.checkins }),
	score: scoreBeitrag('Ziele', () => zieleScore(goalsState.goals, getGoalProgress)),
	hinweise: (jetzt) => [
		...ohneBewegung(goalsState.goals, jetzt),
		...hinterher(goalsState.goals, getGoalProgress, jetzt)
	],
	hinweisArten: [
		{
			art: 'goals.ohne-bewegung',
			titel: 'Ziel ruht seit zwei Wochen',
			bedingung: 'Ein offenes Ziel hat seit 14 Tagen kein Update.',
			standardAktiv: true
		},
		{
			art: 'goals.hinterher',
			titel: 'Ziel liegt hinter dem Plan',
			bedingung: 'Der Fortschritt eines Ziels passt nicht zu seinem Termin.',
			standardAktiv: true
		}
	]
};

/** Das Tagebuch hängt am selben Store (bis T707 trennt). */
export const tagebuchBeitraege: Pick<
	ModulManifest,
	'timeline' | 'export' | 'score' | 'hinweise' | 'hinweisArten'
> = {
	timeline: (von, bis) =>
		tagebuchVerlauf(goalsState.journalEntries, toISODate(von), toISODate(bis)),
	export: () => ({ journal_entries: goalsState.journalEntries }),
	score: scoreBeitrag('Tagebuch', (datum) => tagebuchScore(goalsState.entryForDate(datum))),
	hinweise: (jetzt) => [
		...tagebuchPause(goalsState.journalEntries, jetzt),
		...tagebuchHeute(goalsState.todayEntry, jetzt)
	],
	hinweisArten: [
		{
			art: 'journal.pause',
			titel: 'Drei Tage ohne Tagebucheintrag',
			bedingung: 'In den letzten drei Tagen gibt es keinen Tageseintrag.',
			standardAktiv: false
		},
		{
			art: 'journal.heute',
			titel: 'Heute noch kein Tagebucheintrag',
			bedingung: 'Für heute steht kein Eintrag. Der Tagesabschluss übernimmt diese Frage.',
			standardAktiv: false
		}
	]
};
