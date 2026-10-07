import { defineModul } from '#lib/core/modul.js';
import { timeTrackingState } from '#lib/features/timetracking/store.svelte.js';
import { focusSession } from './session.svelte.js';

export const focusModul = defineModul({
	id: 'focus',
	store: {
		laden: () => timeTrackingState.load(),
		neuLaden: () => timeTrackingState.reload(),
		entladen: () => timeTrackingState.unload(),
		// Eine laufende Session muss auch außerhalb von /focus sichtbar sein.
		nachDemLaden: () => focusSession.restore()
	}
});
