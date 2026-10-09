export interface Neuigkeit {
	version: string;
	/** Veröffentlichungsdatum, leer solange offen. */
	datum: string;
	titel: string;
	punkte: string[];
	/** Hilfethema „Mehr dazu“. */
	hilfe?: string;
}

/** Neueste zuerst. Nur der oberste Eintrag erscheint nach einem Update. */
export const NEUIGKEITEN: Neuigkeit[] = [
	{
		version: '2027.1',
		datum: '',
		titel: 'Life OS 2027',
		punkte: [
			'Neues Heute mit Jetzt-Karte, Tagesplan und freier Zeit',
			'Tag planen und Tag abschließen: kurz, freiwillig, ohne Schuld',
			'Regeln verbinden Module sichtbar, mit Verlauf und Rückgängig',
			'Hilfe überall über ?, Erklärungen über „Warum?“',
			'Neues Aussehen: klare Flächen, harte Kanten, einstellbar unter Darstellung'
		],
		hilfe: 'system.was-ist-life-os'
	}
];

export const neueste = (liste: Neuigkeit[] = NEUIGKEITEN): Neuigkeit | undefined => liste[0];

/** Zeigen, wenn es etwas Neues gibt, das auf diesem Gerät noch nicht gesehen wurde. */
export function zeigeNeuigkeit(gesehen: string, liste: Neuigkeit[] = NEUIGKEITEN): boolean {
	const n = neueste(liste);
	return !!n && n.version !== gesehen;
}
