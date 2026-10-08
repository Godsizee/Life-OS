import { defineModul } from '#lib/core/modul.js';
import { einkaufBeitraege } from './beitraege.js';
import { einkaufErfassen } from './erfassen.js';
import { shoppingState } from './store.svelte.js';

export const shoppingModul = defineModul({
	id: 'shopping',
	...einkaufBeitraege,
	erfassen: [einkaufErfassen],
	store: {
		laden: (ws) => shoppingState.load(ws),
		neuLaden: (ws) => shoppingState.reload(ws),
		entladen: () => shoppingState.unload()
	}
});
