import { defineModul } from '#lib/core/modul.js';
import { analyticsState } from './store.svelte.js';

export const analyticsModul = defineModul({
	id: 'analytics',
	store: {
		laden: () => analyticsState.load(),
		neuLaden: () => analyticsState.reload(),
		entladen: () => analyticsState.unload(),
		// Fehlende Tage nachrechnen, sobald alle relevanten Stores befüllt sind.
		nachDemLaden: () => void analyticsState.backfillScores(7)
	}
});
