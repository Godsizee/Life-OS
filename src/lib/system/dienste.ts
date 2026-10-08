import type { StoreLebenszyklus } from '#lib/core/modul.js';
import { attachmentsState } from '#lib/features/attachments/store.svelte.js';
import { automationenDienst } from '#lib/features/automationen/modul.js';
import { ritualeState } from '#lib/features/dashboard/rituale.svelte.js';
import { linksState } from '#lib/features/links/store.svelte.js';
import { profileState } from '#lib/features/profile/store.svelte.js';
import { remindersState } from '#lib/features/reminders/store.svelte.js';
import { haushaltState } from '#lib/features/workspace/einstellungen.svelte.js';

/** Features ohne eigenen Nav-Eintrag. */
export const DIENSTE: { id: string; store: StoreLebenszyklus }[] = [
	{ id: 'automationen', store: automationenDienst },
	{
		id: 'rituale',
		store: {
			laden: (ws) => ritualeState.load(ws),
			neuLaden: (ws) => ritualeState.reload(ws),
			entladen: () => ritualeState.unload()
		}
	},
	{
		id: 'haushalt',
		store: {
			laden: (ws) => haushaltState.load(ws),
			neuLaden: (ws) => haushaltState.reload(ws),
			entladen: () => haushaltState.unload()
		}
	},
	{
		id: 'profile',
		store: {
			laden: () => profileState.load(),
			neuLaden: () => profileState.reload(),
			entladen: () => profileState.unload()
		}
	},
	{
		id: 'links',
		store: {
			laden: (ws) => linksState.load(ws),
			neuLaden: (ws) => linksState.reload(ws),
			entladen: () => linksState.unload()
		}
	},
	{
		id: 'reminders',
		store: {
			laden: (ws) => remindersState.load(ws),
			neuLaden: (ws) => remindersState.reload(ws),
			entladen: () => remindersState.unload()
		}
	},
	{
		id: 'attachments',
		store: {
			laden: (ws) => attachmentsState.load(ws),
			neuLaden: (ws) => attachmentsState.reload(ws),
			entladen: () => attachmentsState.unload()
		}
	}
];
