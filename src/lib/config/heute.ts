import { z } from 'zod';
import { defineEinstellung } from '#lib/core/einstellungen.js';

/** Ab wann Abendhinweise kommen (z. B. „Serie ist heute noch offen“). */
export const abendAb = defineEinstellung<string>({
	schluessel: 'heute.abendAb',
	ablage: 'nutzer',
	schema: z.string().regex(/^\d{2}:\d{2}$/),
	standard: '18:00',
	label: 'Abendhinweise ab',
	hinweis: 'Ab dieser Uhrzeit weist die App auf offene Routinen mit laufender Serie hin.',
	stufe: 'modul',
	abschnitt: 'heute',
	ui: { art: 'zeit' }
});

/** Wie viele Hinweise „Heute“ höchstens zeigt. */
export const maxHinweise = defineEinstellung<number>({
	schluessel: 'heute.maxHinweise',
	ablage: 'nutzer',
	schema: z.number().int().min(0).max(5),
	standard: 2,
	label: 'Hinweise auf Heute',
	hinweis: 'Höchstzahl der Hinweise, die zugleich erscheinen. 0 zeigt keine.',
	stufe: 'schnell',
	abschnitt: 'hinweise',
	ui: { art: 'zahl', min: 0, max: 5, schritt: 1 }
});
