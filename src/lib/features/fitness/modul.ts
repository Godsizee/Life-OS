import { defineModul } from '#lib/core/modul.js';
import { trainingBeitraege } from './beitraege.js';
// Bewusst nicht hier: fitnessState.loadAllSetLogs() — lazy, von den Auswertungsseiten angestoßen.
import { fitnessState } from './store.svelte.js';

export const fitnessModul = defineModul({
	id: 'fitness',
	...trainingBeitraege,
	store: {
		laden: (ws) => fitnessState.load(ws),
		neuLaden: (ws) => fitnessState.reload(ws),
		entladen: () => fitnessState.unload()
	}
});
