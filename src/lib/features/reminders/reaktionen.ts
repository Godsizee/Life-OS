import { on } from '#lib/core/ereignisse.js';
import { remindersState } from './store.svelte.js';

/**
 * Interne Konsistenz-Reaktionen (Zielbild C4/C6): Erinnerungen folgen ihrem Anker.
 * Für den Nutzer unsichtbar und deshalb ausdrücklich KEINE Regeln. Ersetzt die
 * direkten remindersState-Aufrufe aus Aufgaben, Kalender und Routinen.
 */
export function starteErinnerungsReaktionen(): () => void {
	const ab = [
		on('aufgabe.erledigt', (e) => remindersState.deactivateFor('task', e.daten.id)),
		on('aufgabe.geloescht', (e) => remindersState.removeFor('task', e.daten.id)),
		on('aufgabe.fristGeaendert', (e) =>
			remindersState.syncAnchor('task', e.daten.id, e.daten.dueAt)
		),
		on('termin.geloescht', (e) => remindersState.removeFor('event', e.daten.id)),
		on('termin.startGeaendert', (e) =>
			remindersState.syncAnchor('event', e.daten.id, e.daten.start)
		),
		on('routine.geloescht', (e) => remindersState.removeFor('habit', e.daten.habitId))
	];
	return () => ab.forEach((f) => f());
}
