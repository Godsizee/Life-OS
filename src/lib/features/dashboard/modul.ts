import { defineModul } from '#lib/core/modul.js';
import { erinnerungenAgenda } from '#lib/features/reminders/agenda.js';
import { remindersState } from '#lib/features/reminders/store.svelte.js';

export const dashboardModul = defineModul({
	id: 'dashboard',
	// Eigene Erinnerungen gehören keinem Fachmodul; sie stehen unter Heute im Tagesplan.
	agenda: (tag) => erinnerungenAgenda(remindersState.mine, tag)
});
