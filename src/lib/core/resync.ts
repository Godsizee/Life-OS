/**
 * Abgleich mit dem Server anfordern.
 *
 * HINTERGRUND: Realtime ist die einzige Quelle fuer fremde Aenderungen. Bricht
 * die Verbindung weg — Mobilfunkwechsel, PWA im Hintergrund, Server-Neustart —,
 * meldet Supabase das zwar als Kanalstatus, aber niemand hoerte zu. Alle Stores
 * zeigten ab da still veraltete Daten, bis der Nutzer neu lud. Bei einer
 * geteilten Einkaufsliste heisst das: doppelt gekauft.
 *
 * WARUM EINE REGISTRY: Der eigentliche Abgleich lebt in `workspace-data.ts`,
 * die alle Feature-Stores kennt. `realtime.ts` wird umgekehrt VON diesen Stores
 * importiert — ein direkter Aufruf waere ein Importzyklus. Deshalb hinterlegt
 * `workspace-data.ts` hier eine Funktion, und `realtime.ts` kennt nur diese
 * Datei.
 */

type Abgleich = () => Promise<void>;

/** Kuerzester Abstand zwischen zwei Durchlaeufen. */
const MIN_ABSTAND_MS = 10_000;

let abgleich: Abgleich | null = null;
let letzterLauf = 0;
let laufend: Promise<void> | null = null;

/** Von loadWorkspaceData() gesetzt, von unloadWorkspaceData() geleert. */
export function setzeAbgleich(fn: Abgleich | null): void {
	abgleich = fn;
	letzterLauf = 0;
}

/**
 * Abgleich anfordern. Mehrfachaufrufe innerhalb von MIN_ABSTAND_MS werden
 * verworfen — beim Wiederverbinden melden sich sonst alle 16 Kanaele
 * gleichzeitig und stossen 16 volle Ladevorgaenge an.
 *
 * Bewusst ohne `await`-Zwang: die Aufrufer (Kanalstatus, `online`-Event,
 * `visibilitychange`) haben kein Interesse am Ergebnis.
 */
export function fordereAbgleich(grund: string): void {
	if (!abgleich) return;
	if (laufend) return;

	const jetzt = Date.now();
	if (jetzt - letzterLauf < MIN_ABSTAND_MS) return;
	letzterLauf = jetzt;

	console.info(`[resync] Abgleich angestossen (${grund})`);
	laufend = abgleich()
		.catch((err) => console.error('[resync] Abgleich fehlgeschlagen', err))
		.finally(() => {
			laufend = null;
		});
}

/**
 * Abgleich sofort und ohne Drosselung — fuer Faelle, in denen der Nutzer ihn
 * ausdruecklich ausloest (z. B. „Verwerfen und neu laden" im Dead-Letter-Sheet).
 */
export async function abgleichJetzt(): Promise<void> {
	if (!abgleich) return;
	while (laufend) await laufend;
	letzterLauf = Date.now();
	laufend = abgleich().finally(() => {
		laufend = null;
	});
	return laufend;
}
