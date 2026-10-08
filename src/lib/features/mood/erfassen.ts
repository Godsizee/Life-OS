import type { ErfassenArt } from '#lib/core/modul.js';
import { erkenneStimmung } from '#lib/core/nlp-parse.js';
import { moodState } from './store.svelte.js';

interface Daten {
	score: number;
	note: string | null;
	activities: string[];
}

export const stimmungErfassen: ErfassenArt = {
	id: 'stimmung',
	label: 'Stimmung',
	rang: 20,
	beispiele: ['Stimmung 4 müde', 'Laune heute super #sport'],
	erkennen(text) {
		const r = erkenneStimmung(text, text.toLowerCase());
		if (!r) return null;
		const d = r.parsed as Daten;
		return {
			art: 'Stimmung',
			felder: [{ label: 'Stimmung', wert: `${d.score} von 5` }],
			sicherheit: 0.85,
			daten: d
		};
	},
	async ausfuehren(v) {
		const d = v.daten as Daten;
		await moodState.save(d.score, d.note ?? null, d.activities ?? []);
		return 'Stimmung gespeichert';
	}
};
