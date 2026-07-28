import { toastState } from './toast.svelte';

/**
 * Einheitliche Fehlerbehandlung fuer `load()` in den Feature-Stores.
 *
 * HINTERGRUND: Vorher stand ueberall `try { … } finally { loading = false }`
 * ohne `catch`. Schlug die Query fehl (Netz, RLS, fehlende Tabelle), flog der
 * Fehler aus einem nicht-awaiteten `load()` heraus — unhandled rejection in der
 * Konsole, `subscribe()` wurde nie erreicht (also auch kein Realtime mehr), und
 * die UI zeigte einen leeren Zustand, der nicht von „noch keine Daten" zu
 * unterscheiden war.
 *
 * @returns true bei Erfolg. Bei false darf der Store weder `loaded` setzen noch
 *          abonnieren — und sollte seine `workspaceId` zuruecksetzen, damit der
 *          naechste Aufruf es erneut versucht.
 */
export async function ladeSicher(modul: string, laden: () => Promise<void>): Promise<boolean> {
	try {
		await laden();
		return true;
	} catch (err) {
		console.error(`[${modul}] Laden fehlgeschlagen`, err);
		toastState.error(`${modul} konnte nicht geladen werden`);
		return false;
	}
}
