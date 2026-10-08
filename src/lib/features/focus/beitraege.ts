import { toISODate } from '#lib/core/date.js';
import type { ModulManifest } from '#lib/core/modul.js';
import { scoreBeitrag } from '#lib/core/score.js';
import { profileState } from '#lib/features/profile/store.svelte.js';
import { timeTrackingState } from '#lib/features/timetracking/store.svelte.js';
import { fokusKontext, fokusScore } from './tag.js';
import { fokusVerlauf } from './timeline.js';

export const fokusBeitraege: Pick<ModulManifest, 'timeline' | 'export' | 'score' | 'tageskontext'> =
	{
		timeline: (von, bis) => fokusVerlauf(timeTrackingState.entries, toISODate(von), toISODate(bis)),
		export: () => ({ time_sessions: timeTrackingState.entries }),
		score: scoreBeitrag('Fokus', (datum) =>
			fokusScore(timeTrackingState.entries, datum, profileState.focusDailyGoalMinutes)
		),
		tageskontext: (datum) => fokusKontext(timeTrackingState.entries, datum)
	};
