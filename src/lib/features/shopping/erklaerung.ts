import type { Erklaerung } from '#lib/core/modul.js';
import { CATEGORY_KEYWORDS, CATEGORY_LABELS, guessCategory } from './categories';
import type { KaufStatistik } from './types';

/**
 * „Warum diese Kategorie?“: Entweder hat die Person den Artikel schon einmal einsortiert
 * (Kaufverlauf), oder ein Stichwort aus der Wortliste passt. Rein und testbar.
 */
export function kategorieErklaerung(
	name: string,
	stats: KaufStatistik[] | undefined
): Erklaerung | null {
	const schluessel = name.trim().toLowerCase();
	if (!schluessel) return null;
	const steuerung = [{ label: 'Kategorien ordnen', href: '/shopping' }];
	const bekannt = (stats ?? []).find((s) => s.name === schluessel);
	if (bekannt?.category) {
		const label = CATEGORY_LABELS[bekannt.category] ?? bekannt.category;
		return {
			was: `„${name.trim()}“ kommt in die Kategorie ${label}.`,
			warumJetzt: `Du hast den Artikel ${bekannt.count}× gekauft, zuletzt in dieser Kategorie.`,
			daten: [`Quelle: dein Kaufverlauf (${bekannt.count}×)`],
			staerke: 'Dein Verlauf geht vor der Wortliste.',
			steuerung
		};
	}
	const id = guessCategory(name);
	if (id === 'other') {
		return {
			was: `Für „${name.trim()}“ kennt Life OS keine Kategorie.`,
			warumJetzt: 'Weder dein Verlauf noch die Wortliste enthalten diesen Artikel.',
			daten: ['Quelle: keine, der Artikel kommt unter „Sonstiges“'],
			steuerung
		};
	}
	const wort = (CATEGORY_KEYWORDS[id] ?? []).find((kw) => schluessel.includes(kw));
	return {
		was: `„${name.trim()}“ kommt in die Kategorie ${CATEGORY_LABELS[id] ?? id}.`,
		warumJetzt: `Der Name enthält das Stichwort „${wort}“.`,
		daten: [`Quelle: Wortliste (Stichwort „${wort}“)`],
		staerke: 'Sobald du den Artikel einmal selbst einsortierst, merkt sich Life OS das.',
		steuerung
	};
}
