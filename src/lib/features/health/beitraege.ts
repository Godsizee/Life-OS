import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { scoreBeitrag } from '#lib/core/score.js';
import { profileState } from '#lib/features/profile/store.svelte.js';
import { schlafKnapp, wasserHeute } from './hinweise.js';
import { healthState } from './store.svelte.js';
import { gesundheitKontext, gesundheitScore } from './tag.js';
import { gesundheitVerlauf } from './timeline.js';

const eintragVom = (datum: string) => healthState.entries.find((e) => e.date === datum);

export const gesundheitBeitraege: Pick<
	ModulManifest,
	'timeline' | 'export' | 'score' | 'hinweise' | 'hinweisArten' | 'tageskontext'
> = {
	timeline: (von, bis) => gesundheitVerlauf(healthState.entries, toISODate(von), toISODate(bis)),
	export: () => ({ health_entries: healthState.entries }),
	// Ziele aus den Profil-Einstellungen: Wasser- und Schlafziel sind persönlich.
	score: scoreBeitrag('Gesundheit', (datum) =>
		gesundheitScore(eintragVom(datum), {
			waterGoalMl: profileState.waterGoalMl,
			sleepGoalH: profileState.sleepGoalH
		})
	),
	tageskontext: (datum) => gesundheitKontext(eintragVom(datum)),
	hinweise: (jetzt) => [
		...schlafKnapp(healthState.entries),
		...wasserHeute(healthState.todayEntry, jetzt).map((h) => ({
			...h,
			aktion: {
				label: '+1 Glas',
				ausfuehren: () => healthState.addWater(profileState.glassSizeMl)
			}
		}))
	],
	hinweisArten: [
		{
			art: 'health.schlaf-knapp',
			titel: 'Mehrere kurze Nächte',
			bedingung: 'In drei der letzten fünf Einträge stehen weniger als sechs Stunden Schlaf.',
			standardAktiv: true
		},
		{
			art: 'health.wasser-heute',
			titel: 'Noch kein Wasser eingetragen',
			bedingung: 'Es ist nach 12:00 und für heute steht kein Wasser im Eintrag.',
			standardAktiv: true
		}
	]
};
