import { modulFuerPfad } from '#lib/config/nav.js';
import { hilfeIdFuerPfad } from './hilfe-kern.js';
import { aktiveModule } from './module-aktiv.svelte.js';

/**
 * Link zur Hilfe der Seite unter `pfad` (`?`-Taste im Seitenkopf und Tastenkürzel).
 * Bewusst ohne die System-Texte: Sie liegen in einem eigenen Chunk, der erst mit der Hilfe lädt.
 */
export function hilfeLinkFuer(pfad: string): string {
	const modulThemen = aktiveModule.liste.flatMap((m) => m.hilfe ?? []);
	return `/hilfe/${hilfeIdFuerPfad(pfad, modulThemen, (p) => modulFuerPfad(p)?.id)}`;
}
