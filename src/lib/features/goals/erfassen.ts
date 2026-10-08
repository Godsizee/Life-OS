import type { ErfassenArt, ErfassenVorschau } from '#lib/core/modul.js';
import { erkenneZiel } from '#lib/core/nlp-parse.js';
import { goalsState } from './store.svelte.js';

interface Daten {
	title: string;
}

const vorschau = (d: Daten, sicherheit: number): ErfassenVorschau => ({
	art: 'Ziel',
	felder: [{ label: 'Ziel', wert: d.title }],
	sicherheit,
	daten: d
});

export const zielErfassen: ErfassenArt = {
	id: 'ziel',
	label: 'Ziel',
	rang: 10,
	beispiele: ['Ziel: 10 km laufen'],
	erkennen(text) {
		const r = erkenneZiel(text);
		return r ? vorschau(r.parsed as Daten, 0.8) : null;
	},
	erzwinge: (text) => vorschau({ title: text }, 0.7),
	async ausfuehren(v) {
		await goalsState.addGoal({ title: (v.daten as Daten).title });
		return 'Ziel erstellt';
	}
};
