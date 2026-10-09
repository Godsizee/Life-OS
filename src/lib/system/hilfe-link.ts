import type { ModulId } from '#lib/config/modules.js';
import { modulFuerPfad } from '#lib/config/nav.js';
import type { HilfeThema } from '#lib/core/modul.js';
import { hilfeIdFuerPfad } from './hilfe-kern.js';
import { aktiveModule, istAktiv } from './module-aktiv.svelte.js';

/** Module mit Einstiegsthema `<modul>.einstieg` (Texte in `features/hilfe/inhalte/module.ts`, ein Test hält beides gleich). */
export const MODULE_MIT_EINSTIEG: ModulId[] = [
	'tasks',
	'notes',
	'habits',
	'calendar',
	'shopping',
	'goals',
	'journal',
	'focus',
	'review',
	'mood',
	'health',
	'fitness',
	'analytics',
	'timeline'
];

/**
 * Link zur Hilfe der Seite unter `pfad` (`?`-Taste im Seitenkopf und Tastenkürzel).
 * Bewusst ohne die Texte: Sie liegen in einem eigenen Chunk, der erst mit der Hilfe lädt.
 */
export function hilfeLinkFuer(pfad: string): string {
	const einstiege = MODULE_MIT_EINSTIEG.filter(istAktiv).map((id) => ({ id: `${id}.einstieg` }));
	const modulThemen = [
		...einstiege,
		...aktiveModule.liste.flatMap((m) => m.hilfe ?? [])
	] as HilfeThema[];
	return `/hilfe/${hilfeIdFuerPfad(pfad, modulThemen, (p) => modulFuerPfad(p)?.id)}`;
}
