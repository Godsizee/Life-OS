/**
 * Seitenweises Lesen gegen PostgREST.
 *
 * HINTERGRUND: Supabase kappt jede Antwort bei `max-rows` (Default 1000) — und
 * meldet dabei KEINEN Fehler. Eine Query ohne `.range()` liefert ab dieser Grenze
 * stillschweigend unvollstaendige Daten; Streaks, Jahresuebersichten und
 * Auswertungen rechnen dann mit einem Ausschnitt. Ein groesseres `.limit()` hilft
 * nicht, weil `max-rows` serverseitig gilt.
 *
 * WICHTIG: Jede damit gelesene Query braucht eine DETERMINISTISCHE Sortierung.
 * Ist die Reihenfolge zwischen zwei Seiten nicht stabil, werden Zeilen doppelt
 * gelesen oder uebersprungen. Bei nicht eindeutigen Sortierschluesseln (`date`,
 * `created_at`) gehoert `.order('id')` als letztes Kriterium dazu.
 */

/** Muss <= dem serverseitigen `max-rows` sein, sonst endet die Schleife zu frueh. */
const PAGE_SIZE = 1000;

/** Notbremse gegen Endlosschleifen bei unerwarteten Serverantworten. */
const MAX_PAGES = 50;

interface PageResult<T> {
	data: T[] | null;
	error: { message: string } | null;
}

/**
 * Ruft `seite(from, to)` so lange auf, bis eine Antwort kuerzer als PAGE_SIZE ist.
 *
 * @param label Nur fuer die Warnung, wenn die Notbremse greift.
 */
export async function fetchAllPages<T>(
	label: string,
	seite: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<T[]> {
	const alle: T[] = [];

	for (let index = 0; index < MAX_PAGES; index++) {
		const from = index * PAGE_SIZE;
		const { data, error } = await seite(from, from + PAGE_SIZE - 1);
		if (error) throw error;

		const stapel = data ?? [];
		alle.push(...stapel);
		if (stapel.length < PAGE_SIZE) return alle;
	}

	console.warn(
		`[query] ${label}: Notbremse bei ${MAX_PAGES * PAGE_SIZE} Zeilen — Daten sind unvollstaendig.`
	);
	return alle;
}

/**
 * `yyyy-mm-dd` von vor `tage` Tagen, in LOKALER Zeit.
 * Fuer Verlaufsfenster, damit nicht die gesamte Historie geladen wird.
 */
export function seitTagen(tage: number): string {
	const d = new Date();
	d.setDate(d.getDate() - tage);
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const t = String(d.getDate()).padStart(2, '0');
	return `${d.getFullYear()}-${m}-${t}`;
}

/**
 * Verlaufsfenster (Tage) fuer die beiden Tabellen mit dem staerksten Wachstum.
 * 400 deckt „letzte 12 Monate" inklusive Jahresvergleich ab.
 *
 * Bewusst NUR hier: Tagebuch („An diesem Tag" blickt Jahre zurueck), Ziel-
 * Check-ins und Termine (Serien mit fruehem Startdatum laufen bis heute) duerfen
 * kein Zeitfenster bekommen — die werden nur seitenweise gelesen.
 */
export const VERLAUF_TAGE = {
	/** Streaks, Weekly Review, Analytics — Anzahl Routinen x Tage. */
	habitLogs: 400,
	/** Trainingsverlauf und Volumen-Charts. PRs liegen separat in personal_records. */
	fitnessSetLogs: 400
} as const;
