// Welle F2 — Pace-Anzeige für Cardio-Sätze (Zeit + Strecke → min/km).

/** Pace in min/km, oder null wenn Zeit/Strecke fehlen oder ungültig sind. */
export function computePaceMinPerKm(durationMin: number | null, distanceKm: number | null): number | null {
	if (!durationMin || !distanceKm || durationMin <= 0 || distanceKm <= 0) return null;
	return durationMin / distanceKm;
}

/** Formatiert Pace als "5:30 /km", oder null. */
export function formatPace(durationMin: number | null, distanceKm: number | null): string | null {
	const pace = computePaceMinPerKm(durationMin, distanceKm);
	if (pace === null) return null;
	const wholeMin = Math.floor(pace);
	const seconds = Math.round((pace - wholeMin) * 60);
	const mm = seconds === 60 ? wholeMin + 1 : wholeMin;
	const ss = seconds === 60 ? 0 : seconds;
	return `${mm}:${String(ss).padStart(2, '0')} /km`;
}
