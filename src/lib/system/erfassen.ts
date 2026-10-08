import { aktiveModule } from './module-aktiv.svelte.js';
import { alternativenIn, beispieleIn, deuteIn, type Deutung } from './erfassen-kern.js';

export { SICHERHEIT_MIN, type Deutung } from './erfassen-kern.js';

/** Deutungen des Textes durch die aktiven Module, bester zuerst. */
export const deute = (text: string, jetzt = new Date()): Deutung[] =>
	deuteIn(aktiveModule.liste, text, jetzt);

export const alternativen = (text: string, deutungen: Deutung[]): Deutung[] =>
	alternativenIn(aktiveModule.liste, text, deutungen);

export const beispiele = () => beispieleIn(aktiveModule.liste);
