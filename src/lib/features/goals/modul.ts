import { defineModul } from '#lib/core/modul.js';
import { zielErfassen } from './erfassen.js';
import { goalsAktionen } from './aktionen.js';
// Lädt auch Tagebuch und Check-ins, bis T707 trennt.
import { goalsState } from './store.svelte.js';

export const goalsModul = defineModul({
	id: 'goals',
	erfassen: [zielErfassen],
	store: {
		laden: (ws) => goalsState.load(ws),
		neuLaden: (ws) => goalsState.reload(ws),
		entladen: () => goalsState.unload()
	},
	aktionen: goalsAktionen
});
