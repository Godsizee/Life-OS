import type { ModulId } from '#lib/config/modules.js';
import type { ScoreBeitrag } from './modul.js';

export interface ScoreZeile {
	modul: ModulId;
	label: string;
	/** 0..100; null = keine Daten bzw. nicht anwendbar */
	wert: number | null;
	gewicht: number;
	/** Anteil am Gesamtwert (0..1), 0 wenn die Zeile nicht zählt */
	anteil: number;
	/** Beitrag zum Gesamtwert in Punkten */
	beitrag: number;
	erklaerung: string;
}

export interface ScoreErgebnis {
	/** null = nichts zu bewerten (alle Zeilen ohne Wert oder ohne Gewicht) */
	gesamt: number | null;
	zeilen: ScoreZeile[];
	version: 2;
}

export interface ScoreEingabe {
	modul: ModulId;
	label: string;
	wert: number | null;
	gewicht: number;
	erklaerung: string;
}

/**
 * REIN. Zeilen ohne Wert (null) oder mit Gewicht 0 zählen nicht; die übrigen Gewichte
 * werden neu normiert. Ein fehlender Wert ist keine schlechte Leistung.
 * `fehlendAlsNull`: fehlende Werte zählen stattdessen als 0 (Einstellung `score.fehlend`).
 */
export function verrechne(eingaben: ScoreEingabe[], fehlendAlsNull: boolean): ScoreErgebnis {
	const werte = eingaben.map((e) => ({ ...e, wert: e.wert ?? (fehlendAlsNull ? 0 : null) }));
	const summe = werte
		.filter((e) => e.wert !== null && e.gewicht > 0)
		.reduce((s, e) => s + e.gewicht, 0);
	const zeilen: ScoreZeile[] = werte.map((e) => {
		const zaehlt = e.wert !== null && e.gewicht > 0 && summe > 0;
		const anteil = zaehlt ? e.gewicht / summe : 0;
		return { ...e, anteil, beitrag: zaehlt ? (e.wert as number) * anteil : 0 };
	});
	const gesamt = summe > 0 ? Math.round(zeilen.reduce((s, z) => s + z.beitrag, 0)) : null;
	return { gesamt, zeilen, version: 2 };
}

/** Was ein Modul für einen Tag liefert: der Wert und der Satz dazu, woher er kommt. */
export interface ScoreWert {
	wert: number | null;
	erklaerung: string;
}

/** Baut aus einer reinen Funktion den `ScoreBeitrag` des Manifests (Wert und Erklärung aus einer Rechnung). */
export function scoreBeitrag(label: string, rechne: (datum: string) => ScoreWert): ScoreBeitrag {
	return {
		label,
		berechne: (datum) => {
			const w = rechne(datum).wert;
			return w === null ? null : Math.max(0, Math.min(100, w));
		},
		erklaerung: (datum) => rechne(datum).erklaerung
	};
}

/**
 * Was in `life_scores.breakdown` gespeichert wird: Wert je Modul, dazu Gewichte und Version.
 * Ältere Zeilen haben nur die acht Werte ohne `_version`.
 */
export function alsBreakdown(e: ScoreErgebnis): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	const gewichte: Record<string, number> = {};
	for (const z of e.zeilen) {
		out[z.modul] = z.wert === null ? null : Math.round(z.wert);
		gewichte[z.modul] = z.gewicht;
	}
	return { ...out, _gewichte: gewichte, _version: e.version };
}

// Die Berechnung braucht alle Module; `system/start.ts` hinterlegt sie hier (Register-Muster, Zielbild C4).
let quelle: ((datum: string) => ScoreErgebnis) | null = null;
export function setzeScoreQuelle(fn: ((datum: string) => ScoreErgebnis) | null): void {
	quelle = fn;
}
/** Score für einen Tag nach den aktuellen Einstellungen; ohne Quelle (z. B. in Tests) `null`. */
export function berechneScore(datum: string): ScoreErgebnis | null {
	return quelle ? quelle(datum) : null;
}
