import type { ModulManifest } from '#lib/core/modul.js';
import { listeVoll } from './hinweise.js';
import { shoppingState } from './store.svelte.js';

export const einkaufBeitraege: Pick<ModulManifest, 'export' | 'hinweise' | 'hinweisArten'> = {
	export: () => ({ shopping_items: shoppingState.items }),
	hinweise: () => listeVoll(shoppingState.items),
	hinweisArten: [
		{
			art: 'shopping.liste-voll',
			titel: 'Einkaufsliste ist voll',
			bedingung: 'Mehr als zwölf offene Artikel stehen auf der Liste.',
			standardAktiv: true
		}
	]
};
