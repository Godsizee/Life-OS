/** Rechnung für `Ring.svelte` (viewBox 100 × 100), rein und testbar. */

export interface RingMass {
	/** Radius der Mitte des Farbstrichs. */
	r: number;
	umfang: number;
	/** Radien der beiden Rahmenlinien (außen/innen). */
	aussen: number;
	innen: number;
}

/** `strich` ist die Strichstärke in viewBox-Einheiten. Rahmenlinien sind 2 Einheiten stark. */
export function ringMass(strich: number): RingMass {
	const r = 48 - strich / 2;
	return { r, umfang: 2 * Math.PI * r, aussen: 49, innen: r - strich / 2 - 1 };
}

/** Wert in Prozent auf 0 bis 100 begrenzt; ungültige Werte zählen als 0. */
export function ringProzent(wert: number): number {
	if (!Number.isFinite(wert)) return 0;
	return Math.max(0, Math.min(100, wert));
}

export function ringVersatz(umfang: number, prozent: number): number {
	return umfang - (ringProzent(prozent) / 100) * umfang;
}
