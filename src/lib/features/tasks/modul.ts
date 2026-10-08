import { defineModul } from '#lib/core/modul.js';
import { aufgabenBeitraege } from './beitraege.js';
import { aufgabeErfassen } from './erfassen.js';
import { tasksState } from './store.svelte.js';

export const tasksModul = defineModul({
	id: 'tasks',
	...aufgabenBeitraege,
	erfassen: [aufgabeErfassen],
	store: {
		laden: (ws) => tasksState.load(ws),
		neuLaden: (ws) => tasksState.reload(ws),
		entladen: () => tasksState.unload()
	}
});
