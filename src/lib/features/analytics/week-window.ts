import { fromISODate, toISODate } from '$lib/core/date';

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

/** Montag der Woche, in der `date` liegt (DE-Wochenstart). Schlüssel für focus_week. */
export function weekKey(date: Date): string {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
	return toISODate(d);
}

/** Montag der KOMMENDEN Woche — dafür wählt der Review seine Top-3. */
export function nextWeekKey(date: Date): string {
	const d = fromISODate(weekKey(date))!;
	d.setDate(d.getDate() + 7);
	return toISODate(d);
}
