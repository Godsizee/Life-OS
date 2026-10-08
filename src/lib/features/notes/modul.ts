import { defineModul } from '#lib/core/modul.js';
import { notizenBeitraege } from './beitraege.js';
import { notizErfassen } from './erfassen.js';
import { notesState } from './store.svelte.js';

export const notesModul = defineModul({
	id: 'notes',
	...notizenBeitraege,
	erfassen: [notizErfassen],
	store: {
		laden: (ws) => notesState.load(ws),
		neuLaden: (ws) => notesState.reload(ws),
		entladen: () => notesState.unload()
	}
});
