import { setzeRoutinenQuelle } from '#lib/core/nlp-parse.js';
import { setzeEntladen } from '#lib/core/sitzung.js';
import { habitsState } from '#lib/features/habits/store.svelte.js';
import { entladeAlles } from './daten.js';

/** Einmal beim ersten Mount des Layouts, VOR authState.init(): füllt die Register in core/. */
export function starteSystem(): void {
	setzeEntladen(entladeAlles);
	setzeRoutinenQuelle(() => habitsState.habits);
}
