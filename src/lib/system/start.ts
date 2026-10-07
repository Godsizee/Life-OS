import { setzeRoutinenQuelle } from '#lib/core/nlp-parse.js';
import { setzeEntladen } from '#lib/core/sitzung.js';
import { habitsState } from '#lib/features/habits/store.svelte.js';
import { starteErinnerungsReaktionen } from '#lib/features/reminders/reaktionen.js';
import { entladeAlles } from './daten.js';

let gestartet = false;

/** Einmal beim ersten Mount des Layouts, VOR authState.init(): füllt die Register in core/. */
export function starteSystem(): void {
	// Handler beim Bus nur einmal anmelden — sonst liefe jede Reaktion doppelt.
	if (gestartet) return;
	gestartet = true;
	setzeEntladen(entladeAlles);
	setzeRoutinenQuelle(() => habitsState.habits);
	starteErinnerungsReaktionen();
}
