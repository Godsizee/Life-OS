import { defineModul } from '#lib/core/modul.js';
import { shoppingState } from './store.svelte.js';

export const shoppingModul = defineModul({
	id: 'shopping',
	store: {
		laden: (ws) => shoppingState.load(ws),
		neuLaden: (ws) => shoppingState.reload(ws),
		entladen: () => shoppingState.unload()
	}
});
