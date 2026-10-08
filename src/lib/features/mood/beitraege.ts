import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { moodState } from './store.svelte.js';
import { stimmungVerlauf } from './timeline.js';

export const stimmungBeitraege: Pick<ModulManifest, 'timeline' | 'export'> = {
	timeline: (von, bis) => stimmungVerlauf(moodState.entries, toISODate(von), toISODate(bis)),
	export: () => ({ mood_entries: moodState.entries })
};
