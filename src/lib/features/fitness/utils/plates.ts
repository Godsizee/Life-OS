// Welle F6 — Platten-Rechner: Zielgewicht → Scheiben pro Hantelseite (Greedy).
// Standard-Scheibensatz (kg); Stangengewicht konfigurierbar (20/15/10 kg).

export const DEFAULT_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
export const BAR_WEIGHTS_KG = [20, 15, 10];

export interface PlateCount {
	plateKg: number;
	count: number;
}

export interface PlateBreakdown {
	/** Scheiben pro Seite, schwerste zuerst. */
	perSide: PlateCount[];
	/** Zu beladendes Gewicht pro Seite. */
	perSideKg: number;
	/** Nicht abbildbarer Rest pro Seite (0 bei exakter Lösung). */
	remainderKg: number;
}

function round3(n: number): number {
	return Math.round(n * 1000) / 1000;
}

/** null, wenn das Ziel unter dem Stangengewicht liegt (nicht beladbar). */
export function calculatePlates(
	targetKg: number,
	barKg: number,
	plates: number[] = DEFAULT_PLATES_KG
): PlateBreakdown | null {
	if (targetKg < barKg) return null;
	const perSideKg = round3((targetKg - barKg) / 2);
	let remaining = perSideKg;
	const perSide: PlateCount[] = [];
	for (const plate of [...plates].sort((a, b) => b - a)) {
		const count = Math.floor(round3(remaining / plate));
		if (count <= 0) continue;
		perSide.push({ plateKg: plate, count });
		remaining = round3(remaining - count * plate);
	}
	return { perSide, perSideKg, remainderKg: remaining };
}
