import { defineModul } from '#lib/core/modul.js';
import { terminErfassen } from './erfassen.js';
import { calendarState } from './store.svelte.js';

export const calendarModul = defineModul({
	id: 'calendar',
	erfassen: [terminErfassen],
	store: {
		laden: (ws) => calendarState.load(ws),
		neuLaden: (ws) => calendarState.reload(ws),
		entladen: () => calendarState.unload()
	}
});
