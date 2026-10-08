import { defineModul } from '#lib/core/modul.js';
import { kalenderBeitraege } from './beitraege.js';
import { terminErfassen } from './erfassen.js';
import { calendarState } from './store.svelte.js';

export const calendarModul = defineModul({
	id: 'calendar',
	...kalenderBeitraege,
	erfassen: [terminErfassen],
	store: {
		laden: (ws) => calendarState.load(ws),
		neuLaden: (ws) => calendarState.reload(ws),
		entladen: () => calendarState.unload()
	}
});
