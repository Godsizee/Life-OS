import * as z from 'zod/mini';
import { defineEinstellung, type EinstellungDef } from '#lib/core/einstellungen.js';
import type { ModulManifest } from '#lib/core/modul.js';

export const hinweisSchluessel = (art: string) => `hinweis.${art}.aktiv`;

/** Je deklarierter Hinweis-Art ein Schalter, mit Titel, Bedingung in Klartext und Standard des Moduls. */
export function hinweisArtDefs(
	module: Pick<ModulManifest, 'hinweisArten'>[]
): EinstellungDef<boolean>[] {
	return module.flatMap((m) =>
		(m.hinweisArten ?? []).map((a) =>
			defineEinstellung<boolean>({
				schluessel: hinweisSchluessel(a.art),
				ablage: 'nutzer',
				schema: z.boolean(),
				standard: a.standardAktiv,
				label: a.titel,
				hinweis: a.bedingung,
				stufe: 'modul',
				abschnitt: 'hinweise',
				ui: { art: 'schalter' }
			})
		)
	);
}

/** Zurückgestellte Hinweise: `{ '<hinweis-id>': 'ISO-Zeitpunkt, bis zu dem er ruht' }`. */
export const hinweisSchlummer = defineEinstellung<Record<string, string>>({
	schluessel: 'hinweis.schlummer',
	ablage: 'nutzer',
	schema: z.record(z.string(), z.string()),
	standard: {},
	label: 'Zurückgestellte Hinweise',
	stufe: 'erweitert',
	abschnitt: 'hinweise',
	ui: { art: 'eigen' }
});
