import * as z from 'zod/mini';
import type { ZodMiniType } from 'zod/mini';
import { defineEinstellung, type Ablage, type Stufe } from '#lib/core/einstellungen.js';

interface Option<T extends string> {
	wert: T;
	label: string;
}

function auswahl<T extends string>(
	schluessel: string,
	ablage: Ablage,
	optionen: [Option<T>, ...Option<T>[]],
	standard: T,
	label: string,
	hinweis: string,
	stufe: Stufe
) {
	return defineEinstellung<T>({
		schluessel,
		ablage,
		schema: z.enum(
			optionen.map((o) => o.wert) as unknown as [T, ...T[]]
		) as unknown as ZodMiniType<T>,
		standard,
		label,
		hinweis,
		stufe,
		abschnitt: 'darstellung',
		ui: { art: 'auswahl', optionen }
	});
}

function schalter(
	schluessel: string,
	ablage: Ablage,
	standard: boolean,
	label: string,
	hinweis: string,
	stufe: Stufe
) {
	return defineEinstellung<boolean>({
		schluessel,
		ablage,
		schema: z.boolean(),
		standard,
		label,
		hinweis,
		stufe,
		abschnitt: 'darstellung',
		ui: { art: 'schalter' }
	});
}

export const signal = auswahl(
	'darstellung.signal',
	'nutzer',
	[
		{ wert: 'pink', label: 'Pink' },
		{ wert: 'gelb', label: 'Gelb' },
		{ wert: 'limette', label: 'Limette' },
		{ wert: 'orange', label: 'Orange' },
		{ wert: 'blau', label: 'Blau' }
	],
	'pink',
	'Signalfarbe',
	'Farbe der wichtigsten Taste je Ansicht.',
	'schnell'
);

export const farbintensitaet = auswahl(
	'darstellung.farbintensitaet',
	'nutzer',
	[
		{ wert: 'kraeftig', label: 'Kräftig' },
		{ wert: 'gedaempft', label: 'Gedämpft' }
	],
	'kraeftig',
	'Farbintensität',
	'Gedämpft ist ruhiger für die Augen.',
	'schnell'
);

export const dichte = auswahl(
	'darstellung.dichte',
	'geraet',
	[
		{ wert: 'komfort', label: 'Komfort' },
		{ wert: 'kompakt', label: 'Kompakt' }
	],
	'komfort',
	'Dichte',
	'Kompakt zeigt mehr auf einmal. Tasten bleiben groß genug.',
	'schnell'
);

export const schrift = auswahl(
	'darstellung.schrift',
	'geraet',
	[
		{ wert: '100', label: '100 %' },
		{ wert: '112', label: '112 %' },
		{ wert: '125', label: '125 %' }
	],
	'100',
	'Schriftgröße',
	'Vergrößert alle Texte.',
	'schnell'
);

export const bewegung = auswahl(
	'darstellung.bewegung',
	'geraet',
	[
		{ wert: 'system', label: 'System' },
		{ wert: 'reduziert', label: 'Reduziert' }
	],
	'system',
	'Bewegung',
	'Reduziert schaltet Animationen ab.',
	'schnell'
);

export const kanten = auswahl(
	'darstellung.kanten',
	'geraet',
	[
		{ wert: 'eckig', label: 'Eckig' },
		{ wert: 'gerundet', label: 'Gerundet' }
	],
	'eckig',
	'Kanten',
	'Gerundet macht Flächen und Tasten weicher.',
	'erweitert'
);

export const muster = schalter(
	'darstellung.muster',
	'geraet',
	true,
	'Punktraster',
	'Punktraster im Hintergrund.',
	'erweitert'
);

export const sticker = schalter(
	'darstellung.sticker',
	'nutzer',
	true,
	'Sticker',
	'Schräge Sticker wie „NEU“ oder „AUTO“. Aus = gerade Labels.',
	'erweitert'
);

/** Reihenfolge der Darstellungs-Einstellungen in der Oberfläche. */
export const DARSTELLUNG = [
	signal,
	farbintensitaet,
	dichte,
	schrift,
	bewegung,
	kanten,
	muster,
	sticker
];
