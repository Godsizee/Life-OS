import * as z from 'zod/mini';
import { defineEinstellung, setze, wert, type EinstellungDef } from '#lib/core/einstellungen.js';
import type { Regel, RegelUeberschreibung } from './types.js';

/** Hauptschalter: aus = keine Regel läuft, die Überschreibungen bleiben erhalten. */
export const automationAlle = defineEinstellung<boolean>({
	schluessel: 'automation.alle',
	ablage: 'nutzer',
	schema: z.boolean(),
	standard: true,
	label: 'Verknüpfungen',
	hinweis: 'Schaltet alle Verknüpfungen zwischen den Modulen gemeinsam ein oder aus.',
	stufe: 'schnell',
	abschnitt: 'automationen',
	ui: { art: 'schalter' }
});

/** Bestandsnutzer: die einmalige Einrichtung von sys:training-routine ist gelaufen. */
export const automationEingerichtet = defineEinstellung<boolean>({
	schluessel: 'automation.eingerichtet',
	ablage: 'nutzer',
	schema: z.boolean(),
	standard: false,
	label: 'Verknüpfungen eingerichtet',
	stufe: 'erweitert',
	abschnitt: 'automationen',
	ui: { art: 'eigen' }
});

const ueberschreibungSchema = z.object({
	aktiv: z.optional(z.boolean()),
	modus: z.optional(z.enum(['auto', 'fragen'])),
	parameter: z.optional(z.record(z.string(), z.unknown()))
});

/** Flacher Schlüssel je Regel: 'automation.<regelId>' (Zielbild C7, Speicher). */
export function regelEinstellung(regelId: string): EinstellungDef<RegelUeberschreibung> {
	return defineEinstellung<RegelUeberschreibung>({
		schluessel: `automation.${regelId}`,
		ablage: 'nutzer',
		schema: ueberschreibungSchema,
		standard: {},
		label: regelId,
		stufe: 'erweitert',
		abschnitt: 'automationen',
		ui: { art: 'eigen' }
	});
}

export const leseUeberschreibung = (regelId: string): RegelUeberschreibung =>
	wert(regelEinstellung(regelId));

export function leseUeberschreibungen(regeln: Regel[]): Record<string, RegelUeberschreibung> {
	return Object.fromEntries(regeln.map((r) => [r.id, leseUeberschreibung(r.id)]));
}

/**
 * Ändert nur die übergebenen Felder. Die Parameter werden gemergt — wer `habitId` setzt,
 * darf `mlProEinheit` nicht verlieren.
 */
export async function setzeUeberschreibung(
	regelId: string,
	patch: RegelUeberschreibung
): Promise<void> {
	const alt = leseUeberschreibung(regelId);
	const neu: RegelUeberschreibung = { ...alt, ...patch };
	if (patch.parameter) neu.parameter = { ...alt.parameter, ...patch.parameter };
	await setze(regelEinstellung(regelId), neu);
}

/** Zurück auf die Standardwerte der Regel. */
export async function loescheUeberschreibung(regelId: string): Promise<void> {
	await setze(regelEinstellung(regelId), {});
}
