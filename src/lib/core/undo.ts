import { toastState } from './toast.svelte';

/**
 * Löschen mit Bedenkzeit.
 *
 * HINTERGRUND: Die Listen löschen per Wischgeste — auf dem Handy, mit dem
 * Daumen, oft aus Versehen. Ein Bestätigungsdialog vor jedem Wisch würde die
 * Geste entwerten; ein „Rückgängig" danach nicht.
 *
 * Ablauf: sofort lokal ausblenden, damit sich die Liste anfühlt wie zuvor. Der
 * Schreibvorgang zum Server geht ERST nach Ablauf des Fensters raus — bis dahin
 * ist die Rücknahme rein lokal und braucht keinen zweiten Request.
 */
const FENSTER_MS = 6000;

export interface UndoOptions {
	/** Toast-Text, z. B. „Aufgabe gelöscht". */
	text: string;
	/** Zeile lokal entfernen. */
	ausblenden: () => void;
	/** Zeile lokal zurückholen. */
	wiederherstellen: () => void;
	/** Endgültig löschen — läuft erst nach Ablauf des Fensters. */
	festschreiben: () => Promise<void> | void;
}

export function loeschenMitUndo({
	text,
	ausblenden,
	wiederherstellen,
	festschreiben
}: UndoOptions): void {
	ausblenden();

	let zurueckgenommen = false;

	// Wird die Seite innerhalb des Fensters verlassen, erreicht das Löschen den
	// Server nie und die Zeile ist nach dem Neuladen wieder da. Das ist die
	// harmlose Richtung des Fehlers — nichts geht verloren.
	const timer = setTimeout(() => {
		if (zurueckgenommen) return;
		void Promise.resolve(festschreiben()).catch((err) => {
			console.error('[undo] Löschen fehlgeschlagen', err);
			wiederherstellen();
			toastState.error('Löschen fehlgeschlagen');
		});
	}, FENSTER_MS);

	toastState.withAction(
		'info',
		text,
		{
			label: 'Rückgängig',
			run: () => {
				zurueckgenommen = true;
				clearTimeout(timer);
				wiederherstellen();
			}
		},
		FENSTER_MS
	);
}
