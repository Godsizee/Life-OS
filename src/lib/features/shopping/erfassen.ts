import { erkenneEinkauf } from '#lib/core/nlp-parse.js';
import type { ErfassenArt, ErfassenVorschau } from '#lib/core/modul.js';
import { shoppingState } from './store.svelte.js';

interface Daten {
	name: string;
	quantity: number;
}

function vorschau(d: Daten, sicherheit: number): ErfassenVorschau {
	return {
		art: 'Einkauf',
		felder: [
			{ label: 'Artikel', wert: d.name },
			{ label: 'Menge', wert: String(d.quantity) }
		],
		sicherheit,
		daten: d
	};
}

export const einkaufErfassen: ErfassenArt = {
	id: 'einkauf',
	label: 'Einkauf',
	rang: 40,
	beispiele: ['3x Eier', 'Milch kaufen'],
	erkennen(text) {
		const r = erkenneEinkauf(text, text.toLowerCase());
		return r ? vorschau(r.parsed as Daten, 0.9) : null;
	},
	erzwinge: (text) => vorschau({ name: text, quantity: 1 }, 0.7),
	async ausfuehren(v) {
		const d = v.daten as Daten;
		await shoppingState.addItem({ name: d.name, qty: d.quantity });
		return 'Zum Einkauf hinzugefügt';
	}
};
