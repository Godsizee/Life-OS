import type { HilfeThema, ModulManifest } from '#lib/core/modul.js';
import { passung } from '#lib/core/text.js';

/** Rein (testbar in Node). Gebunden an die aktiven Module wird in hilfe.ts. */

export const START_THEMA = 'system.was-ist-life-os';

/** System-Themen plus die Themen aller übergebenen Module. */
export function sammleThemen(
	module: Pick<ModulManifest, 'hilfe'>[],
	system: HilfeThema[]
): HilfeThema[] {
	return [...system, ...module.flatMap((m) => m.hilfe ?? [])];
}

export const findeThema = (themen: HilfeThema[], id: string): HilfeThema | undefined =>
	themen.find((t) => t.id === id);

/** Themen, die zur Anfrage passen (Titel, `kurz`, Begriffe), beste zuerst. Ohne Anfrage alle. */
export function sucheThemen(themen: HilfeThema[], anfrage: string): HilfeThema[] {
	const q = anfrage.trim();
	if (!q) return themen;
	return themen
		.map((t) => ({
			t,
			g: Math.max(
				passung(t.titel, q),
				passung(t.kurz, q) * 0.7,
				...(t.begriffe ?? []).map((b) => passung(b.wort, q) * 0.9)
			)
		}))
		.filter((x) => x.g > 0)
		.sort((a, b) => b.g - a.g)
		.map((x) => x.t);
}

export interface Glossareintrag {
	wort: string;
	erklaerung: string;
	/** Thema, in dem der Begriff steht. */
	thema: string;
}

/** Alle Begriffe aller Themen, alphabetisch (deutsche Sortierung); doppelte Wörter nur einmal. */
export function glossar(themen: HilfeThema[]): Glossareintrag[] {
	const gesehen = new Set<string>();
	const eintraege: Glossareintrag[] = [];
	for (const t of themen) {
		for (const b of t.begriffe ?? []) {
			const schluessel = b.wort.toLowerCase();
			if (gesehen.has(schluessel)) continue;
			gesehen.add(schluessel);
			eintraege.push({ wort: b.wort, erklaerung: b.erklaerung, thema: t.id });
		}
	}
	return eintraege.sort((a, b) => a.wort.localeCompare(b.wort, 'de'));
}

/**
 * Hilfe zur Seite unter `pfad`: das Einstiegsthema des Moduls, sonst „Was ist Life OS?“.
 * `modulIdFuerPfad` liefert die Modul-Id zu einem Pfad (wie beim Modul-Tor).
 */
export function hilfeIdFuerPfad(
	pfad: string,
	themen: HilfeThema[],
	modulIdFuerPfad: (pfad: string) => string | undefined
): string {
	if (pfad === '/' || pfad.startsWith('/heute')) return 'system.heute';
	const modul = modulIdFuerPfad(pfad);
	const einstieg = modul ? `${modul}.einstieg` : null;
	return einstieg && findeThema(themen, einstieg) ? einstieg : START_THEMA;
}

/** Gruppen der Übersicht: System zuerst, dann je Modul. */
export function gruppiereThemen(themen: HilfeThema[]): { gruppe: string; themen: HilfeThema[] }[] {
	const system = themen.filter((t) => t.id.startsWith('system.'));
	const rest = themen.filter((t) => !t.id.startsWith('system.'));
	const jeModul = new Map<string, HilfeThema[]>();
	for (const t of rest) {
		const modul = t.id.split('.')[0];
		jeModul.set(modul, [...(jeModul.get(modul) ?? []), t]);
	}
	return [
		...(system.length ? [{ gruppe: 'system', themen: system }] : []),
		...[...jeModul].map(([gruppe, ts]) => ({ gruppe, themen: ts }))
	];
}
