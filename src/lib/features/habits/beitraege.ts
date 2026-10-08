import { Repeat } from '@lucide/svelte';
import { abendAb } from '#lib/config/heute.js';
import { toISODate } from '#lib/core/date.js';
import { wert } from '#lib/core/einstellungen.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { scoreBeitrag } from '#lib/core/score.js';
import { sucheIn } from '#lib/core/suche.js';
import { serieOffen } from './hinweise.js';
import { habitsState } from './store.svelte.js';
import { routinenKontext, routinenScore } from './tag.js';
import { routinenVerlauf } from './timeline.js';

const tageVon = (id: string) => habitsState.entriesFor(id);

export const routinenBeitraege: Pick<
	ModulManifest,
	| 'suche'
	| 'verknuepfbar'
	| 'timeline'
	| 'export'
	| 'score'
	| 'hinweise'
	| 'hinweisArten'
	| 'tageskontext'
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
	export: () => ({ habits: habitsState.habits, habit_logs: habitsState.logs }),
	score: scoreBeitrag('Routinen', (datum) => routinenScore(habitsState.habits, tageVon, datum)),
	tageskontext: (datum) => routinenKontext(habitsState.habits, tageVon, datum),
	hinweise: (jetzt) =>
		serieOffen(habitsState.habits, tageVon, jetzt, wert(abendAb)).map((h) => ({
			...h,
			// Direkt abhaken, ohne die Seite zu verlassen.
			aktion: {
				label: 'Erledigt',
				ausfuehren: () => habitsState.toggleToday(h.id.split(':')[1])
			}
		})),
	hinweisArten: [
		{
			art: 'habits.serie-offen',
			titel: 'Laufende Serie ist heute noch offen',
			bedingung:
				'Eine Serie von mindestens drei Einheiten läuft, die Routine ist offen und es ist Abend.',
			standardAktiv: true
		}
	]
};
