import {
	abendAb,
	maxHinweise,
	planenBis,
	abschlussAb,
	rituale,
	standardDauerMin,
	tagesbeginn,
	tagesende,
	wiederkehrTage
} from '#lib/config/heute.js';
import { modules } from '#lib/config/modules.js';
import type { EinstellungDef, Stufe } from '#lib/core/einstellungen.js';
import { haptik, toene } from '#lib/core/geraet-einstellungen.js';
import { automationAlle } from '#lib/features/automationen/einstellungen.js';
import { aktiveModule } from '../module-aktiv.svelte.js';
import { gewichtDefsAktiv } from '../score.js';
import { DARSTELLUNG } from './darstellung.js';
import { hilfeNiveau } from './hilfe.js';
import { hinweisArtDefs } from './hinweise.js';
import { MODUL_AKTIV } from './module.js';
import { scoreAnzeigen, scoreFehlend } from './score.js';

export interface Abschnitt {
	/** Anker in /settings, z. B. `score` → `/settings#score`. */
	id: string;
	titel: string;
	/** Ein Satz unter der Überschrift. */
	hinweis: string;
	defs: EinstellungDef<unknown>[];
}

/** Reihenfolge nach Stufe: erst die schnellen, dann die Modul-Einstellungen; „erweitert“ liegt hinter „Mehr Optionen“. */
const RANG: Record<Stufe, number> = { schnell: 0, modul: 1, erweitert: 2 };
export const nachStufe = (defs: EinstellungDef<unknown>[]) =>
	[...defs].sort((a, b) => RANG[a.stufe] - RANG[b.stufe]);

const alsDef = (d: unknown) => d as EinstellungDef<unknown>;

/**
 * Alle Einstellungen, die die Oberfläche selbst erzeugt, nach Abschnitten. Hängt von den
 * eingeschalteten Modulen ab (Hinweise und Gewichte) und ist darum reaktiv zu lesen.
 */
export function abschnitte(): Abschnitt[] {
	const module = modules.filter((m) => !m.pflicht).map((m) => alsDef(MODUL_AKTIV[m.id]));
	return [
		{
			id: 'darstellung',
			titel: 'Darstellung',
			hinweis: 'Farben, Dichte und Schrift. Änderungen gelten sofort.',
			defs: [...DARSTELLUNG, haptik, toene].map(alsDef)
		},
		{
			id: 'module',
			titel: 'Module',
			hinweis: 'Schalte ein, was du brauchst. Ausgeschaltete Module behalten ihre Daten.',
			defs: module
		},
		{
			id: 'heute',
			titel: 'Heute',
			hinweis: 'Dein Tagesfenster und die Rituale.',
			defs: [
				tagesbeginn,
				tagesende,
				rituale,
				planenBis,
				abschlussAb,
				wiederkehrTage,
				standardDauerMin
			].map(alsDef)
		},
		{
			id: 'hinweise',
			titel: 'Hinweise',
			hinweis:
				'Hinweise erscheinen nur, wenn die Bedingung erfüllt ist. Jeder lässt sich abschalten.',
			defs: [maxHinweise, abendAb, ...hinweisArtDefs(aktiveModule.liste)].map(alsDef)
		},
		{
			id: 'score',
			titel: 'Life Score',
			hinweis: 'Was in den Score eingeht. Fehlende Einträge zählen nicht gegen dich.',
			defs: [scoreAnzeigen, scoreFehlend, ...gewichtDefsAktiv()].map(alsDef)
		},
		{
			id: 'hilfe',
			titel: 'Hilfe',
			hinweis: 'Wie viel Life OS von sich aus erklärt.',
			defs: [hilfeNiveau].map(alsDef)
		},
		{
			id: 'automationen',
			titel: 'Verknüpfungen',
			hinweis: 'Regeln zwischen den Modulen, sichtbar und abschaltbar.',
			defs: [automationAlle].map(alsDef)
		}
	];
}

/** Trifft die Suche Label oder Hinweis? Groß- und Kleinschreibung egal, Umlaute und ß wie getippt. */
export function trifft(
	def: Pick<EinstellungDef<unknown>, 'label' | 'hinweis'>,
	suche: string
): boolean {
	const q = suche.trim().toLocaleLowerCase('de');
	if (!q) return true;
	return `${def.label} ${def.hinweis ?? ''}`.toLocaleLowerCase('de').includes(q);
}
