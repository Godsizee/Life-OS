import { setzeEntladen } from '#lib/core/sitzung.js';
import { entladeAlles } from './daten.js';

/** Einmal beim ersten Mount des Layouts, VOR authState.init(): füllt die Register in core/. */
export function starteSystem(): void {
	setzeEntladen(entladeAlles);
}
