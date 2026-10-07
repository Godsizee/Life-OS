import { defineModul } from '#lib/core/modul.js';
import { habitsState } from './store.svelte.js';

export const habitsModul = defineModul({
	id: 'habits',
	store: {
		laden: (ws) => habitsState.load(ws),
		neuLaden: (ws) => habitsState.reload(ws),
		entladen: () => habitsState.unload()
	}
});
