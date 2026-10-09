import type { Bereich } from './modules';

/** Bereiche in Anzeigereihenfolge, mit der Frage, die der Bereich beantwortet (Zielbild C2). */
export const BEREICHE: { id: Bereich; label: string; frage: string }[] = [
	{ id: 'heute', label: 'Heute', frage: 'Was zählt jetzt?' },
	{ id: 'planen', label: 'Planen', frage: 'Was nehme ich mir vor?' },
	{ id: 'machen', label: 'Machen', frage: 'Wobei bin ich gerade?' },
	{ id: 'reflektieren', label: 'Reflektieren', frage: 'Wie geht es mir, was hat sich bewährt?' },
	{ id: 'wissen', label: 'Wissen', frage: 'Was will ich behalten?' }
];

/** Gruppiert Module nach Bereich in der Reihenfolge von `BEREICHE`. Leere Bereiche entfallen. */
export function nachBereich<T extends { bereich: Bereich }>(
	liste: T[]
): { bereich: (typeof BEREICHE)[number]; eintraege: T[] }[] {
	return BEREICHE.map((bereich) => ({
		bereich,
		eintraege: liste.filter((m) => m.bereich === bereich.id)
	})).filter((g) => g.eintraege.length > 0);
}
