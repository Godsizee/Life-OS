import { goto } from '$app/navigation';
import { aktionen } from '#lib/core/aktionen.js';
import '#lib/core/geraet.svelte.js'; // registriert den Geräte-Speicher
import { setzeRoutinenQuelle } from '#lib/core/nlp-parse.js';
import { setzeScoreQuelle } from '#lib/core/score.js';
import { setzeHilfeQuelle } from '#lib/core/hilfe.js';
import { setzeEntladen } from '#lib/core/sitzung.js';
import { setzeTageskontextQuelle } from '#lib/core/tageskontext.js';
import { verknuepfbar } from '#lib/core/verknuepfbar.js';
import { starteAutomationen } from '#lib/features/automationen/laufzeit.svelte.js';
import { habitsState } from '#lib/features/habits/store.svelte.js';
import { starteErinnerungsReaktionen } from '#lib/features/reminders/reaktionen.js';
import { entladeAlles } from './daten.js';
import { hilfeLinkFuer } from './hilfe-link.js';
import { istAktiv } from './module-aktiv.svelte.js';
import { MODULE } from './module.js';
import { berechneModulScore } from './score.js';
import { baueTageskontext } from './tageskontext.js';
import { willkommen } from './willkommen.svelte.js';

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
	// Verknüpfbare Objekte: Abgeschaltete Module bieten nichts mehr an.
	for (const m of MODULE) {
		for (const def of m.verknuepfbar ?? []) {
			verknuepfbar.setze(def.typ, { ...def, alle: () => (istAktiv(m.id) ? def.alle() : []) });
		}
	}
	setzeHilfeQuelle(hilfeLinkFuer);
	setzeScoreQuelle(berechneModulScore);
	setzeTageskontextQuelle(baueTageskontext);
	starteAutomationen({
		modulAktiv: istAktiv,
		oeffneRegel: (regelId) => void goto(`/settings/automationen#${regelId}`)
	});

	// „Willkommen zurück“ (T407): letzten aktiven Tag beim Start lesen, beim Verlassen festhalten.
	willkommen.aufwachen();
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') willkommen.schlafen();
		else willkommen.aufwachen();
	});
}
