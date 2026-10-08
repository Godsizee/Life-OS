import type { ErfassenArt } from '#lib/core/modul.js';
import { erkenneRoutine } from '#lib/core/nlp-parse.js';
import { habitsState } from './store.svelte.js';

interface Daten {
	habitId: string;
	name: string;
}

export const routineErfassen: ErfassenArt = {
	id: 'routine',
	label: 'Routine',
	rang: 60,
	beispiele: ['Laufen', 'erledigt Meditation'],
	erkennen(text) {
		const r = erkenneRoutine(text.toLowerCase());
		if (!r) return null;
		const d = r.parsed as Daten;
		return {
			art: 'Routine',
			felder: [{ label: 'Routine', wert: d.name }],
			sicherheit: 0.8,
			daten: d
		};
	},
	async ausfuehren(v) {
		const d = v.daten as Daten;
		await habitsState.toggleToday(d.habitId);
		return `Routine „${d.name}" geloggt`;
	}
};
