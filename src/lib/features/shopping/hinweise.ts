import type { Hinweis } from '#lib/core/modul.js';
import type { ShoppingItem } from './types.js';

const VOLL_AB = 12;

/** `shopping.liste-voll`: Mehr als zwölf offene Artikel. */
export function listeVoll(items: Pick<ShoppingItem, 'checked'>[]): Hinweis[] {
	const offen = items.filter((i) => !i.checked).length;
	if (offen <= VOLL_AB) return [];
	return [
		{
			id: 'shopping.liste-voll:sammel',
			art: 'shopping.liste-voll',
			titel: `${offen} offene Artikel auf der Einkaufsliste`,
			text: 'Vielleicht ist ein Einkauf fällig.',
			warum: {
				was: `Auf der Einkaufsliste stehen ${offen} offene Artikel.`,
				warumJetzt: `Ab mehr als ${VOLL_AB} offenen Artikeln wird die Liste unübersichtlich.`,
				daten: [`Offene Artikel: ${offen}`],
				steuerung: [{ label: 'Diese Art Hinweis abschalten', href: '/settings#hinweise' }]
			},
			aktion: { label: 'Liste öffnen', href: '/shopping' },
			prioritaet: 20
		}
	];
}
