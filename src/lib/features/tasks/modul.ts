import { defineModul } from '#lib/core/modul.js';
import { tasksState } from './store.svelte.js';

export const tasksModul = defineModul({
	id: 'tasks',
	store: {
		laden: (ws) => tasksState.load(ws),
		neuLaden: (ws) => tasksState.reload(ws),
		entladen: () => tasksState.unload()
	}
});
