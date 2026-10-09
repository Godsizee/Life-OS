import * as z from 'zod/mini';
import { defineEinstellung } from '#lib/core/einstellungen.js';

/** Ab wann Abendhinweise kommen (z. B. „Serie ist heute noch offen“). */
export const abendAb = defineEinstellung<string>({
	schluessel: 'heute.abendAb',
	ablage: 'nutzer',
	schema: z.string().check(z.regex(/^\d{2}:\d{2}$/)),
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
	schema: z.int().check(z.minimum(0), z.maximum(5)),
	standard: 2,
	label: 'Hinweise auf Heute',
	hinweis: 'Höchstzahl der Hinweise, die zugleich erscheinen. 0 zeigt keine.',
	stufe: 'schnell',
	abschnitt: 'hinweise',
	ui: { art: 'zahl', min: 0, max: 5, schritt: 1 }
});

const zeit = z.string().check(z.regex(/^\d{2}:\d{2}$/));

/** Beginn des planbaren Tages — Grundlage der freien Zeit im Tagesplan. */
export const tagesbeginn = defineEinstellung<string>({
	schluessel: 'heute.tagesbeginn',
	ablage: 'nutzer',
	schema: zeit,
	standard: '08:00',
	label: 'Tagesbeginn',
	hinweis: 'Beginn deines planbaren Tages.',
	stufe: 'modul',
	abschnitt: 'heute',
	ui: { art: 'zeit' }
});

/** Ende des planbaren Tages. */
export const tagesende = defineEinstellung<string>({
	schluessel: 'heute.tagesende',
	ablage: 'nutzer',
	schema: zeit,
	standard: '20:00',
	label: 'Tagesende',
	hinweis: 'Ende deines planbaren Tages.',
	stufe: 'modul',
	abschnitt: 'heute',
	ui: { art: 'zeit' }
});

/** Zeigt „Tag planen“ und „Tag abschließen“ als Band auf Heute. */
export const rituale = defineEinstellung<boolean>({
	schluessel: 'heute.rituale',
	ablage: 'nutzer',
	schema: z.boolean(),
	standard: true,
	label: 'Tagesrituale',
	hinweis: 'Zeigt „Tag planen“ und „Tag abschließen“ an.',
	stufe: 'schnell',
	abschnitt: 'heute',
	ui: { art: 'schalter' }
});

/** Bis wann „Tag planen“ angeboten wird. */
export const planenBis = defineEinstellung<string>({
	schluessel: 'heute.planenBis',
	ablage: 'nutzer',
	schema: zeit,
	standard: '11:00',
	label: 'Tag planen bis',
	hinweis: 'Bis wann „Tag planen“ angeboten wird.',
	stufe: 'erweitert',
	abschnitt: 'heute',
	ui: { art: 'zeit' }
});

/** Ab wann „Tag abschließen“ angeboten wird. */
export const abschlussAb = defineEinstellung<string>({
	schluessel: 'heute.abschlussAb',
	ablage: 'nutzer',
	schema: zeit,
	standard: '18:00',
	label: 'Tag abschließen ab',
	hinweis: 'Ab wann „Tag abschließen“ angeboten wird.',
	stufe: 'erweitert',
	abschnitt: 'heute',
	ui: { art: 'zeit' }
});

/** Eingeplante Minuten für Aufgaben ohne Schätzung. */
export const standardDauerMin = defineEinstellung<number>({
	schluessel: 'aufgaben.standardDauerMin',
	ablage: 'nutzer',
	schema: z.int().check(z.minimum(5), z.maximum(240)),
	standard: 30,
	label: 'Dauer ohne Schätzung',
	hinweis: 'So viel wird für Aufgaben ohne Schätzung eingeplant.',
	stufe: 'modul',
	abschnitt: 'tasks',
	ui: { art: 'zahl', min: 5, max: 240, schritt: 5, einheit: 'min' }
});

/** Letzter Tag, an dem die App auf diesem Gerät offen war ('yyyy-mm-dd'). Quelle für „Willkommen zurück“. */
export const zuletztAktiv = defineEinstellung<string>({
	schluessel: 'geraet.zuletztAktiv',
	ablage: 'geraet',
	schema: z.string(),
	standard: '',
	label: 'Zuletzt aktiv',
	stufe: 'erweitert',
	abschnitt: 'heute',
	ui: { art: 'eigen' }
});

/** Nach so vielen Tagen Pause zeigt Heute „Willkommen zurück“. */
export const wiederkehrTage = defineEinstellung<number>({
	schluessel: 'heute.wiederkehrTage',
	ablage: 'nutzer',
	schema: z.int().check(z.minimum(1), z.maximum(30)),
	standard: 3,
	label: 'Willkommen zurück nach',
	hinweis: 'Nach so vielen Tagen ohne die App bietet Heute einen Neustart an.',
	stufe: 'erweitert',
	abschnitt: 'heute',
	ui: { art: 'zahl', min: 1, max: 30, schritt: 1, einheit: 'Tage' }
});

/** „Nicht jetzt“ auf der Jetzt-Karte: Einträge, die dieses Gerät bis zum Zeitpunkt `bis` nicht mehr als Jetzt zeigt. */
export const nichtJetzt = defineEinstellung<{ key: string; bis: string }[]>({
	schluessel: 'heute.nichtJetzt',
	ablage: 'geraet',
	schema: z.array(z.object({ key: z.string(), bis: z.string() })),
	standard: [],
	label: 'Zurückgestellte Jetzt-Einträge',
	stufe: 'erweitert',
	abschnitt: 'heute',
	ui: { art: 'eigen' }
});
