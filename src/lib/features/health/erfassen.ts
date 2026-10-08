import { formatZahl } from '#lib/core/locale.js';
import type { ErfassenArt } from '#lib/core/modul.js';
import { erkenneGesundheit } from '#lib/core/nlp-parse.js';
import { healthState } from './store.svelte.js';

interface Daten {
	weight_kg: number | null;
	sleep_h: number | null;
	water_ml: number | null;
	energy: number | null;
	steps: number | null;
	distance_km: number | null;
	pulse_bpm: number | null;
}

export const gesundheitErfassen: ErfassenArt = {
	id: 'gesundheit',
	label: 'Gesundheit',
	rang: 30,
	beispiele: ['75,4 kg', '7,5 h geschlafen', '2 Gläser Wasser'],
	erkennen(text) {
		const r = erkenneGesundheit(text, text.toLowerCase());
		if (!r) return null;
		const d = r.parsed as Daten;
		const felder: { label: string; wert: string }[] = [];
		if (d.weight_kg !== null)
			felder.push({ label: 'Gewicht', wert: `${formatZahl(d.weight_kg)} kg` });
		if (d.sleep_h !== null) felder.push({ label: 'Schlaf', wert: `${formatZahl(d.sleep_h)} h` });
		if (d.water_ml !== null) felder.push({ label: 'Wasser', wert: `${d.water_ml} ml` });
		if (d.energy !== null) felder.push({ label: 'Energie', wert: `${d.energy} von 5` });
		if (d.steps !== null) felder.push({ label: 'Schritte', wert: String(d.steps) });
		if (d.distance_km !== null)
			felder.push({ label: 'Strecke', wert: `${formatZahl(d.distance_km)} km` });
		if (d.pulse_bpm !== null) felder.push({ label: 'Puls', wert: `${d.pulse_bpm} bpm` });
		return { art: 'Gesundheit', felder, sicherheit: 0.9, daten: d };
	},
	async ausfuehren(v) {
		const d = v.daten as Daten;
		const heute = healthState.todayEntry;
		// Nur ergänzen, was angegeben wurde: Der Rest des Tages bleibt unverändert.
		await healthState.save({
			weight_kg: d.weight_kg ?? heute?.weight_kg ?? null,
			sleep_h: d.sleep_h ?? heute?.sleep_h ?? null,
			water_ml: d.water_ml ?? heute?.water_ml ?? null,
			energy: d.energy ?? heute?.energy ?? null
		});
		return 'Gesundheitseintrag aktualisiert';
	}
};
