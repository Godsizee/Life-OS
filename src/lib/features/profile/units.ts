// Einheiten-Registry — eine Quelle für Umrechnung, Anzeige und Eingabegrenzen.
// Keine Svelte-/Store-/lucide-Abhaengigkeit, damit alles in vitest (Node) laeuft.

export type WaterUnit = 'glasses' | 'ml';
export type WeightUnit = 'kg' | 'lb';

/** Standardgröße eines Glases in ml, wenn der Nutzer nichts eingestellt hat. */
export const DEFAULT_GLASS_SIZE_ML = 250;

export const GLASS_SIZE_LIMITS = { min: 100, max: 1000, step: 50 } as const;
export const WATER_GOAL_ML_LIMITS = { min: 250, max: 6000, step: 250 } as const;
export const HEIGHT_LIMITS = { min: 100, max: 250, step: 1 } as const;

const LB_PER_KG = 2.2046226218;

export function kgToLb(kg: number): number {
	return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
	return lb / LB_PER_KG;
}

/** Gläser → ml. Nicht-endliche oder negative Werte ergeben 0. */
export function glassesToMl(glasses: number, glassSizeMl = DEFAULT_GLASS_SIZE_ML): number {
	if (!Number.isFinite(glasses) || glasses <= 0) return 0;
	return Math.round(glasses * glassSizeMl);
}

/** ml → Gläser (gerundet auf eine Nachkommastelle). */
export function mlToGlasses(ml: number, glassSizeMl = DEFAULT_GLASS_SIZE_ML): number {
	if (!Number.isFinite(ml) || ml <= 0 || glassSizeMl <= 0) return 0;
	return Math.round((ml / glassSizeMl) * 10) / 10;
}

/** Anzeige einer Wassermenge in der vom Nutzer gewählten Einheit. */
export function formatWater(
	ml: number | null,
	unit: WaterUnit,
	glassSizeMl = DEFAULT_GLASS_SIZE_ML
): string {
	if (ml === null) return '—';
	if (unit === 'ml') {
		return ml >= 1000
			? `${(ml / 1000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} l`
			: `${Math.round(ml).toLocaleString('de-DE')} ml`;
	}
	const glasses = mlToGlasses(ml, glassSizeMl);
	return glasses === 1 ? '1 Glas' : `${glasses.toLocaleString('de-DE')} Gläser`;
}

/** Anzeige eines Gewichts in der vom Nutzer gewählten Einheit. Gespeichert wird immer kg. */
export function formatWeight(kg: number | null, unit: WeightUnit): string {
	if (kg === null) return '—';
	const value = unit === 'lb' ? kgToLb(kg) : kg;
	return `${value.toLocaleString('de-DE', { maximumFractionDigits: 1 })} ${unit}`;
}

/** BMI aus kg und cm. null, wenn eines von beiden fehlt oder unplausibel ist. */
export function bmi(kg: number | null, heightCm: number | null): number | null {
	if (kg === null || heightCm === null || heightCm < HEIGHT_LIMITS.min) return null;
	const m = heightCm / 100;
	return Math.round((kg / (m * m)) * 10) / 10;
}

export type BmiCategory = 'untergewicht' | 'normal' | 'uebergewicht' | 'adipositas';

export function bmiCategory(value: number): BmiCategory {
	if (value < 18.5) return 'untergewicht';
	if (value < 25) return 'normal';
	if (value < 30) return 'uebergewicht';
	return 'adipositas';
}

export const BMI_LABELS: Record<BmiCategory, string> = {
	untergewicht: 'Untergewicht',
	normal: 'Normalgewicht',
	uebergewicht: 'Übergewicht',
	adipositas: 'Adipositas'
};
