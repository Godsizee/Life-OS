import { formatDauer, formatTagKurz, formatUhr } from '#lib/core/date.js';
import type { ErfassenArt } from '#lib/core/modul.js';
import { erkenneTermin } from '#lib/core/nlp-parse.js';
import { calendarState } from './store.svelte.js';

interface Daten {
	title: string;
	due_at: string;
}

/** Termine dauern ohne Angabe eine Stunde. */
const STANDARD_DAUER_MIN = 60;

export const terminErfassen: ErfassenArt = {
	id: 'termin',
	label: 'Termin',
	rang: 50,
	beispiele: ['Zahnarzt morgen 10:00', 'Meeting Freitag 14 Uhr'],
	erkennen(text) {
		const r = erkenneTermin(text, text.toLowerCase());
		if (!r) return null;
		const d = r.parsed as Daten;
		const start = new Date(d.due_at);
		return {
			art: 'Termin',
			felder: [
				{ label: 'Titel', wert: d.title },
				{ label: 'Wann', wert: `${formatTagKurz(start)} · ${formatUhr(start)}` },
				{ label: 'Dauer', wert: formatDauer(STANDARD_DAUER_MIN) }
			],
			sicherheit: 0.85,
			daten: d
		};
	},
	async ausfuehren(v) {
		const d = v.daten as Daten;
		const end = new Date(new Date(d.due_at).getTime() + STANDARD_DAUER_MIN * 60_000).toISOString();
		await calendarState.addEvent({ title: d.title, start: d.due_at, end });
		return 'Kalendertermin erstellt';
	}
};
