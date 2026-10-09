import * as z from 'zod/mini';
import { defineEinstellung } from './einstellungen.js';

/** Gerätewerte, die Kern-Code liest (Vibration, Signaltöne). Die Oberfläche steht unter Einstellungen → Darstellung. */
export const haptik = defineEinstellung<boolean>({
	schluessel: 'geraet.haptik',
	ablage: 'geraet',
	schema: z.boolean(),
	standard: true,
	label: 'Vibration',
	hinweis: 'Vibration beim Tippen und bei Signalen (nur Android).',
	stufe: 'erweitert',
	abschnitt: 'darstellung',
	ui: { art: 'schalter' }
});

export const toene = defineEinstellung<boolean>({
	schluessel: 'geraet.toene',
	ablage: 'geraet',
	schema: z.boolean(),
	standard: true,
	label: 'Signaltöne',
	hinweis: 'Signaltöne von Fokus und Pausentimer.',
	stufe: 'erweitert',
	abschnitt: 'darstellung',
	ui: { art: 'schalter' }
});
