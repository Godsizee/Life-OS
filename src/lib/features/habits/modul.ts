import { defineModul } from '#lib/core/modul.js';
import { routineErfassen } from './erfassen.js';
import { habitsAktionen } from './aktionen.js';
import { habitsState } from './store.svelte.js';

export const habitsModul = defineModul({
	id: 'habits',
	erfassen: [routineErfassen],
	store: {
		laden: (ws) => habitsState.load(ws),
		neuLaden: (ws) => habitsState.reload(ws),
		entladen: () => habitsState.unload()
	},
	aktionen: habitsAktionen
});
