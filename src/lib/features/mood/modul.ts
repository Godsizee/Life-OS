import { defineModul } from '#lib/core/modul.js';
import { moodState } from './store.svelte.js';

export const moodModul = defineModul({
	id: 'mood',
	store: {
		laden: () => moodState.load(),
		neuLaden: () => moodState.reload(),
		entladen: () => moodState.unload()
	}
});
