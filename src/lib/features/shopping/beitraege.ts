import type { ModulManifest } from '#lib/core/modul.js';
import { shoppingState } from './store.svelte.js';

export const einkaufBeitraege: Pick<ModulManifest, 'export'> = {
	export: () => ({ shopping_items: shoppingState.items })
};
