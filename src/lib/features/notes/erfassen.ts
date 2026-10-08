import type { ErfassenArt, ErfassenVorschau } from '#lib/core/modul.js';
import { erkenneNotiz } from '#lib/core/nlp-parse.js';
import { notesState } from './store.svelte.js';

interface Daten {
	title: string;
	body: string;
}

/** Ab dieser Länge ist es eher ein Gedanke zum Festhalten als eine Aufgabe. */
const LANGER_TEXT = 140;
const TITEL_MAX = 60;

function vorschau(d: Daten, sicherheit: number, rang?: number): ErfassenVorschau {
	const felder = [{ label: 'Titel', wert: d.title }];
	if (d.body)
		felder.push({ label: 'Text', wert: d.body.length > 80 ? `${d.body.slice(0, 80)}…` : d.body });
	return { art: 'Notiz', felder, sicherheit, daten: d, rang };
}

/** Titel = erster Satz bzw. die ersten Wörter; der ganze Text bleibt als Inhalt. */
function ausLangemText(text: string): Daten {
	const satz = text.split(/(?<=[.!?])\s/)[0];
	const titel =
		satz.length <= TITEL_MAX ? satz : `${satz.slice(0, TITEL_MAX).replace(/\s+\S*$/, '')}…`;
	return { title: titel, body: text };
}

export const notizErfassen: ErfassenArt = {
	id: 'notiz',
	label: 'Notiz',
	rang: 0,
	beispiele: ['Notiz: Ideen für Urlaub', 'notiere Passwort ändern - Rezept für Lasagne'],
	erkennen(text) {
		const r = erkenneNotiz(text);
		if (r) return vorschau(r.parsed as Daten, 0.8);
		// Rang knapp vor „Aufgabe“: ein langer Text darf eine ausdrückliche Gesundheits- oder Terminangabe nicht verdrängen.
		if (text.length > LANGER_TEXT) return vorschau(ausLangemText(text), 0.8, 65);
		return null;
	},
	erzwinge: (text) =>
		vorschau(text.length > TITEL_MAX ? ausLangemText(text) : { title: text, body: '' }, 0.7),
	async ausfuehren(v) {
		const d = v.daten as Daten;
		await notesState.addNote({ title: d.title, body: d.body || undefined });
		return 'Notiz erstellt';
	}
};
