import { goto } from '$app/navigation';
import { aktionen } from '#lib/core/aktionen.js';
import '#lib/core/geraet.svelte.js'; // registriert den Geräte-Speicher
import { setzeRoutinenQuelle } from '#lib/core/nlp-parse.js';
import { setzeEntladen } from '#lib/core/sitzung.js';
import { starteAutomationen } from '#lib/features/automationen/laufzeit.svelte.js';
import { habitsState } from '#lib/features/habits/store.svelte.js';
import { starteErinnerungsReaktionen } from '#lib/features/reminders/reaktionen.js';
import { entladeAlles } from './daten.js';
import { istAktiv } from './module-aktiv.svelte.js';
import { MODULE } from './module.js';

let gestartet = false;

/** Einmal beim ersten Mount des Layouts, VOR authState.init(): füllt die Register in core/. */
export function starteSystem(): void {
	// Handler beim Bus nur einmal anmelden — sonst liefe jede Reaktion doppelt.
	if (gestartet) return;
	gestartet = true;
	setzeEntladen(entladeAlles);
	setzeRoutinenQuelle(() => habitsState.habits);
	starteErinnerungsReaktionen();

	// Aktionen aller Manifeste in das Register von core/ — Automationen finden sie über ihre globale ID.
	for (const m of MODULE) {
		for (const [id, def] of Object.entries(m.aktionen ?? {})) aktionen.setze(id, def);
	}
	starteAutomationen({
		modulAktiv: istAktiv,
		oeffneRegel: (regelId) => void goto(`/settings/automationen#${regelId}`)
	});
}
