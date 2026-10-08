import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { timeTrackingState } from '#lib/features/timetracking/store.svelte.js';
import { fokusVerlauf } from './timeline.js';

export const fokusBeitraege: Pick<ModulManifest, 'timeline' | 'export'> = {
	timeline: (von, bis) => fokusVerlauf(timeTrackingState.entries, toISODate(von), toISODate(bis)),
	export: () => ({ time_sessions: timeTrackingState.entries })
};
