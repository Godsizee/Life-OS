import * as z from 'zod/mini';
import { defineEinstellung } from '#lib/core/einstellungen.js';

/** Leer = Einrichtung steht aus. `bestand-<Datum>` = Bestandskonto übernommen, sonst setzt der Assistent (T503) das Datum. */
export const setupAbgeschlossen = defineEinstellung<string>({
	schluessel: 'setup.abgeschlossen',
	ablage: 'nutzer',
	schema: z.string(),
	standard: '',
	label: 'Einrichtung abgeschlossen',
	stufe: 'erweitert',
	abschnitt: 'setup',
	ui: { art: 'eigen' }
});
