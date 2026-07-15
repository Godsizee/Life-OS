/**
 * motion.ts
 * Zentrale Motion-Konstanten (Soft Depth, Abschnitt 2.3). Jede animierte
 * Komponente importiert Dauern/Easings von hier statt eigene Werte zu raten.
 */

export const DURATION = { fast: 150, base: 250, slow: 350 } as const;

export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Analog zu CSS cubic-bezier(): liefert eine (t: number) => number Easing-Funktion. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
	const a = (v1: number, v2: number) => 1 - 3 * v2 + 3 * v1;
	const b = (v1: number, v2: number) => 3 * v2 - 6 * v1;
	const c = (v1: number) => 3 * v1;

	const bezierAt = (t: number, v1: number, v2: number) => ((a(v1, v2) * t + b(v1, v2)) * t + c(v1)) * t;
	const slopeAt = (t: number, v1: number, v2: number) => 3 * a(v1, v2) * t * t + 2 * b(v1, v2) * t + c(v1);

	function tForX(x: number): number {
		let t = x;
		for (let i = 0; i < 8; i++) {
			const dx = bezierAt(t, x1, x2) - x;
			const slope = slopeAt(t, x1, x2);
			if (Math.abs(slope) < 1e-6) break;
			t -= dx / slope;
		}
		return t;
	}

	return (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : bezierAt(tForX(x), y1, y2));
}

/** Standard-Easing für Micro-Interactions/Sheets/Modals. */
export const EASE_STANDARD = cubicBezier(0.32, 0.72, 0, 1);
/** Spring-Feel-Easing für Cards. */
export const EASE_SPRING = cubicBezier(0.34, 1.56, 0.64, 1);

/** Dauer 0 bei Reduced Motion, sonst der übergebene Wert. */
export function motionDuration(ms: number): number {
	return prefersReducedMotion() ? 0 : ms;
}
