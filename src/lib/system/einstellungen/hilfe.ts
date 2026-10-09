import * as z from 'zod/mini';
import { defineEinstellung } from '#lib/core/einstellungen.js';

export type HilfeNiveau = 'ausfuehrlich' | 'standard' | 'knapp';

/** Wie viel Erklärung die App zeigt: ausführlich (Erklärzeilen), standard (nur ⓘ), knapp (keine Intros). */
export const hilfeNiveau = defineEinstellung<HilfeNiveau>({
	schluessel: 'hilfe.niveau',
	ablage: 'nutzer',
	schema: z.enum(['ausfuehrlich', 'standard', 'knapp']),
	standard: 'standard',
	label: 'Wie viel Erklärung?',
	hinweis: 'Ausführlich zeigt Erklärzeilen. Knapp blendet Einführungen aus.',
	stufe: 'schnell',
	abschnitt: 'hilfe',
	ui: {
		art: 'auswahl',
		optionen: [
			{ wert: 'ausfuehrlich', label: 'Ausführlich' },
			{ wert: 'standard', label: 'Standard' },
			{ wert: 'knapp', label: 'Knapp' }
		]
	}
});

/** Bereits gesehene Einführungen und Tipps, z. B. `intro:tasks`. „Tipps erneut zeigen“ leert die Liste. */
export const hilfeGesehen = defineEinstellung<string[]>({
	schluessel: 'hilfe.gesehen',
	ablage: 'nutzer',
	schema: z.array(z.string()),
	standard: [],
	label: 'Gesehene Tipps',
	stufe: 'erweitert',
	abschnitt: 'hilfe',
	ui: { art: 'eigen' }
});

/** Blendet „Erste Schritte“ auf Heute dauerhaft aus. */
export const ersteSchritteAus = defineEinstellung<boolean>({
	schluessel: 'hilfe.ersteSchritteAus',
	ablage: 'nutzer',
	schema: z.boolean(),
	standard: false,
	label: 'Erste Schritte ausblenden',
	stufe: 'erweitert',
	abschnitt: 'hilfe',
	ui: { art: 'schalter' }
});

/** Zuletzt gesehene Version von „Was ist neu“ — gilt nur für dieses Gerät. */
export const neuigkeitenGesehen = defineEinstellung<string>({
	schluessel: 'neuigkeiten.gesehen',
	ablage: 'geraet',
	schema: z.string(),
	standard: '',
	label: 'Zuletzt gesehene Neuigkeit',
	stufe: 'erweitert',
	abschnitt: 'hilfe',
	ui: { art: 'eigen' }
});
