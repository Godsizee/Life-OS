import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { healthState } from './store.svelte.js';
import { gesundheitVerlauf } from './timeline.js';

export const gesundheitBeitraege: Pick<ModulManifest, 'timeline' | 'export'> = {
	timeline: (von, bis) => gesundheitVerlauf(healthState.entries, toISODate(von), toISODate(bis)),
	export: () => ({ health_entries: healthState.entries })
};
