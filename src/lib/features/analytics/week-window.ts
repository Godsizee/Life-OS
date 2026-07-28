import { toISODate } from '$lib/core/date';

/**
 * Zeitfenster des Weekly Review.
 *
 * VORHER war das `weekStart.setDate(now.getDate() - now.getDay() - 6)` mit dem
 * Kommentar „letzte 7 Tage". Beides stimmte nicht zusammen: die Formel ergab an
 * sechs von sieben Tagen Montag–Sonntag der VORWOCHE, nur sonntags die laufende
 * Woche. Der Review zeigte also meistens die Zahlen der falschen Woche.
 *
 * Jetzt bewusst „die letzten 7 Tage inklusive heute" — das passt zu einem
 * Rückblick, der an einem beliebigen Tag geöffnet wird, und ist an jedem
 * Wochentag dasselbe.
 */
export const REVIEW_TAGE = 7;

export interface WeekWindow {
	/** Erster Tag des Fensters (lokale Mitternacht). */
	start: Date;
	/** Letzter Tag des Fensters = `heute`. */
	end: Date;
	/** Alle Tage als `yyyy-mm-dd`, aufsteigend. Länge = REVIEW_TAGE. */
	dates: string[];
}

/**
 * @param heute Referenztag. Immer übergeben statt intern `new Date()` zu rufen —
 *              sonst friert das Fenster beim Erzeugen der Komponente ein und
 *              wandert nicht über Mitternacht mit.
 */
export function reviewWeek(heute: Date, tage: number = REVIEW_TAGE): WeekWindow {
	const end = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
	const start = new Date(end);
	start.setDate(end.getDate() - (tage - 1));

	const dates = Array.from({ length: tage }, (_, i) => {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		return toISODate(d);
	});

	return { start, end, dates };
}
