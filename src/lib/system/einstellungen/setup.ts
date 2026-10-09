import * as z from 'zod/mini';
import { defineEinstellung } from '#lib/core/einstellungen.js';
import type { SetupAbsicht } from '#lib/config/modules.js';

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

/** Wobei Life OS helfen soll — Auswahl im Assistenten, steuert die Erste Schritte. */
export const setupAbsichten = defineEinstellung<SetupAbsicht[]>({
	schluessel: 'setup.absichten',
	ablage: 'nutzer',
	schema: z.array(z.enum(['tag-planen', 'befinden', 'routinen', 'haushalt', 'fitness', 'wissen'])),
	standard: [],
	label: 'Wobei Life OS helfen soll',
	stufe: 'erweitert',
	abschnitt: 'setup',
	ui: { art: 'eigen' }
});
