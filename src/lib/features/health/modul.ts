import { defineModul } from '#lib/core/modul.js';
import { healthState } from './store.svelte.js';

export const healthModul = defineModul({
	id: 'health',
	store: {
		laden: () => healthState.load(),
		neuLaden: () => healthState.reload(),
		entladen: () => healthState.unload()
	}
});
