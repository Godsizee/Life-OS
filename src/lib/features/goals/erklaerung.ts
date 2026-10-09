import type { Erklaerung } from '#lib/core/modul.js';
import type { TrackResult } from './checkins.js';

interface ZielAngaben {
	id: string;
	title: string;
	target_date: string | null;
	created_at: string;
}

const tag = (iso: string) => iso.slice(0, 10).split('-').reverse().join('.');

/**
 * „Warum Auf Kurs / hinterher?“: Soll bis heute gegen Ist, Zieltermin und, bei Zielwert-Zielen,
 * die nötige Rate je Tag. Rein, damit sich die Sätze testen lassen.
 */
export function trackErklaerung(
	ziel: ZielAngaben,
	track: TrackResult,
	proTag: { wert: number; einheit: string } | null = null
): Erklaerung {
	const steuerung = [{ label: 'Ziel ansehen', href: `/goals/${ziel.id}` }];
	if (track.state === 'no_date') {
		return {
			was: `„${ziel.title}“ hat kein Zieldatum, deshalb gibt es keinen Vergleich mit der Zeit.`,
			warumJetzt: `Ist-Stand: ${track.actual} %.`,
			daten: [`Angelegt am ${tag(ziel.created_at)}`],
			steuerung
		};
	}
	const delta = track.actual - track.expected;
	const daten = [
		`Zeitraum: ${tag(ziel.created_at)} bis ${tag(ziel.target_date ?? '')}`,
		`Soll bis heute: ${track.expected} % (linear über den Zeitraum)`,
		`Ist: ${track.actual} %`,
		`Abstand: ${delta > 0 ? '+' : ''}${delta} Prozentpunkte (Toleranz ±5)`,
		track.daysLeft >= 0
			? `Verbleibende Tage: ${track.daysLeft}`
			: `Frist seit ${-track.daysLeft} Tagen vorbei`
	];
	if (proTag) {
		daten.push(`Nötig bis zum Zieldatum: ${proTag.wert} ${proTag.einheit} pro Tag`);
	}
	return {
		was: `„${track.label}“ vergleicht den Fortschritt mit der Zeit, die bis zum Zieldatum vergangen ist.`,
		warumJetzt: `Soll ${track.expected} %, Ist ${track.actual} %.`,
		daten,
		staerke: 'Ein Vergleich, keine Wertung: Ziele dürfen sich verschieben.',
		steuerung
	};
}
