import { z } from 'zod';
import type { ModulId } from '#lib/config/modules.js';
import { defineEinstellung, type EinstellungDef } from '#lib/core/einstellungen.js';

/** Vorgabe-Gewichte (0–5). Module ohne Eintrag zählen mit 0, bis jemand sie einschaltet. */
export const STANDARD_GEWICHT: Partial<Record<ModulId, number>> = {
	tasks: 4,
	habits: 4,
	health: 2,
	fitness: 2,
	goals: 2,
	journal: 2,
	mood: 2,
	focus: 1
};

export const scoreSchluessel = (id: ModulId) => `score.gewicht.${id}`;

export function scoreGewichtDef(id: ModulId, label: string): EinstellungDef<number> {
	return defineEinstellung<number>({
		schluessel: scoreSchluessel(id),
		ablage: 'nutzer',
		schema: z.number().int().min(0).max(5),
		standard: STANDARD_GEWICHT[id] ?? 0,
		label,
		hinweis: 'Wie stark dieser Bereich in den Life Score eingeht. 0 nimmt ihn heraus.',
		stufe: 'modul',
		abschnitt: 'score',
		ui: { art: 'zahl', min: 0, max: 5, schritt: 1 }
	});
}

export const scoreFehlend = defineEinstellung<'ignorieren' | 'null'>({
	schluessel: 'score.fehlend',
	ablage: 'nutzer',
	schema: z.enum(['ignorieren', 'null']),
	standard: 'ignorieren',
	label: 'Fehlende Einträge',
	hinweis:
		'Ohne Eintrag (z. B. keine Stimmung) wird der Bereich übergangen. Alternativ zählt er als 0.',
	stufe: 'modul',
	abschnitt: 'score',
	ui: {
		art: 'auswahl',
		optionen: [
			{ wert: 'ignorieren', label: 'Übergehen' },
			{ wert: 'null', label: 'Als 0 zählen' }
		]
	}
});

export const scoreAnzeigen = defineEinstellung<boolean>({
	schluessel: 'score.anzeigen',
	ablage: 'nutzer',
	schema: z.boolean(),
	standard: true,
	label: 'Life Score anzeigen',
	hinweis: 'Zeigt den Life Score auf Heute. Die Berechnung läuft unabhängig davon weiter.',
	stufe: 'schnell',
	abschnitt: 'score',
	ui: { art: 'schalter' }
});
