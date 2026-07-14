// F5 — Gesten: horizontale Wisch-Erkennung für Tab-Wechsel (Segmented-Control).
// Passiv (kein preventDefault) — es gibt keinen horizontalen Seiten-Scroll, mit dem
// wir konkurrieren; vertikaler Scroll bleibt dadurch unberührt. Wischgesten, die auf
// einem Bedienelement oder einem als [data-noswipe] markierten Bereich starten
// (Steppers, Chip-Leisten, Swipe-to-Delete-Zeilen), werden ignoriert.
import type { Action } from 'svelte/action';

interface SwipeOptions {
	onLeft?: () => void;
	onRight?: () => void;
	/** Mindest-Horizontaldistanz in px, bevor eine Geste zählt. */
	threshold?: number;
}

const IGNORE_SELECTOR = 'input,textarea,select,button,a,[data-noswipe]';

export const swipe: Action<HTMLElement, SwipeOptions | undefined> = (node, params) => {
	let opts = params ?? {};
	let startX = 0;
	let startY = 0;
	let tracking = false;

	function onPointerDown(e: PointerEvent) {
		if (e.pointerType === 'mouse') return; // nur Touch/Pen — Maus wischt nicht
		if ((e.target as HTMLElement)?.closest(IGNORE_SELECTOR)) return;
		tracking = true;
		startX = e.clientX;
		startY = e.clientY;
	}

	function onPointerUp(e: PointerEvent) {
		if (!tracking) return;
		tracking = false;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		const threshold = opts.threshold ?? 60;
		if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 2) return;
		if (dx < 0) opts.onLeft?.();
		else opts.onRight?.();
	}

	node.addEventListener('pointerdown', onPointerDown, { passive: true });
	node.addEventListener('pointerup', onPointerUp, { passive: true });
	node.addEventListener('pointercancel', () => (tracking = false), { passive: true });

	return {
		update(next) {
			opts = next ?? {};
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('pointerup', onPointerUp);
		}
	};
};
