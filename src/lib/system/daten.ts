/**
 * Zentrales Laden/Entladen aller Workspace-Daten über die Manifeste (ersetzt
 * system/daten.ts).
 *
 * HINTERGRUND: Früher lud und entlud jede Route ihre Stores selbst. Die Listen
 * stimmten an acht Stellen nicht überein: Global gerenderte Komponenten (Ctrl+K,
 * Erfassen) sahen je nach Route andere Daten, modulübergreifende Logik lief ins
 * Leere, und der Wechsel aufs Dashboard lud alles neu.
 *
 * Jetzt: einmal nach dem Workspace-Load, entladen nur beim Logout. Die Stores
 * haben einen `workspaceId`-Early-Return, ein zweiter Aufruf ist gratis.
 */
import { setzeAbgleich } from '#lib/core/resync.js';
import { workspaceState } from '#lib/features/workspace/store.svelte.js';
import { DIENSTE } from './dienste.js';
import { MODULE } from './module.js';

const alle = () => [
	...DIENSTE.map((d) => d.store),
	...MODULE.flatMap((m) => (m.store ? [m.store] : []))
];

/**
 * Lädt alles parallel. Ein einzelner Fehlschlag darf die übrigen nicht
 * verhindern — die Stores melden ihn selbst (Toast) und bleiben leer.
 */
export async function ladeAlles(workspaceId: string): Promise<void> {
	await Promise.allSettled(alle().map((s) => s.laden(workspaceId)));
	for (const s of alle()) s.nachDemLaden?.();
	// Ab jetzt kann ein Verbindungsabbruch einen Abgleich auslösen.
	setzeAbgleich(() => abgleichen(workspaceId));
}

/**
 * Abgleich mit dem Server, ohne den sichtbaren Zustand vorher zu leeren:
 * `neuLaden()` setzt nur die gemerkte `workspaceId` zurück, die Daten bleiben bis
 * zur neuen Antwort stehen. `load()` ruft am Ende `subscribe()` und stellt damit
 * auch die Realtime-Abos wieder her.
 *
 * Ausgelöst von: Kanalstatus in core/realtime.ts, `online` und `visibilitychange`.
 */
export async function abgleichen(workspaceId: string): Promise<void> {
	// Zuerst der Workspace selbst: Stores ohne Parameter lesen die ID von dort.
	await workspaceState.reload();
	await Promise.allSettled(alle().map((s) => s.neuLaden(workspaceId)));
}

/** Nur beim Logout — alle Abos schließen und den Zustand verwerfen. */
export function entladeAlles(): void {
	setzeAbgleich(null);
	for (const s of alle()) s.entladen();
}
