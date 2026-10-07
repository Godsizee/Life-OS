import { defineModul } from '#lib/core/modul.js';
import { notesState } from './store.svelte.js';

export const notesModul = defineModul({
	id: 'notes',
	store: {
		laden: (ws) => notesState.load(ws),
		neuLaden: (ws) => notesState.reload(ws),
		entladen: () => notesState.unload()
	}
});
