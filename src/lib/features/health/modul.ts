import { defineModul } from '#lib/core/modul.js';
import { gesundheitBeitraege } from './beitraege.js';
import { gesundheitErfassen } from './erfassen.js';
import { healthState } from './store.svelte.js';

export const healthModul = defineModul({
	id: 'health',
	...gesundheitBeitraege,
	erfassen: [gesundheitErfassen],
	store: {
		laden: () => healthState.load(),
		neuLaden: () => healthState.reload(),
		entladen: () => healthState.unload()
	}
});
