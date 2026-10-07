import { defineModul } from '#lib/core/modul.js';
import { calendarState } from './store.svelte.js';

export const calendarModul = defineModul({
	id: 'calendar',
	store: {
		laden: (ws) => calendarState.load(ws),
		neuLaden: (ws) => calendarState.reload(ws),
		entladen: () => calendarState.unload()
	}
});
