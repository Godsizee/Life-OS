import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { scoreBeitrag } from '#lib/core/score.js';
import { moodState } from './store.svelte.js';
import { stimmungKontext, stimmungScore } from './tag.js';
import { stimmungVerlauf } from './timeline.js';

export const stimmungBeitraege: Pick<
	ModulManifest,
	'timeline' | 'export' | 'score' | 'tageskontext'
> = {
	timeline: (von, bis) => stimmungVerlauf(moodState.entries, toISODate(von), toISODate(bis)),
	export: () => ({ mood_entries: moodState.entries }),
	score: scoreBeitrag('Stimmung', (datum) => stimmungScore(moodState.entries, datum)),
	tageskontext: (datum) => stimmungKontext(moodState.entries, datum)
};
