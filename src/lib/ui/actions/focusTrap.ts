/**
 * focusTrap.ts
 * Svelte-Action für Overlays: fängt Tab/Shift+Tab innerhalb des Node,
 * fokussiert das erste fokussierbare Element beim Mount, gibt den Fokus
 * beim Destroy an den ursprünglichen Trigger zurück.
 */

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableEls(node: HTMLElement): HTMLElement[] {
	return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
		(el) => el.offsetParent !== null
	);
}

export function focusTrap(node: HTMLElement) {
	const previouslyFocused = document.activeElement as HTMLElement | null;

	const first = focusableEls(node)[0];
	(first ?? node).focus();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		const els = focusableEls(node);
		if (els.length === 0) return;
		const firstEl = els[0];
		const lastEl = els[els.length - 1];
		if (e.shiftKey && document.activeElement === firstEl) {
			e.preventDefault();
			lastEl.focus();
		} else if (!e.shiftKey && document.activeElement === lastEl) {
			e.preventDefault();
			firstEl.focus();
		}
	}

	node.addEventListener('keydown', handleKeydown);

	return {
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
			previouslyFocused?.focus();
		}
	};
}

let lockCount = 0;
let previousOverflow = '';

/** Body-Scroll sperren (referenzgezählt für verschachtelte Overlays). */
export function lockScroll() {
	if (typeof document === 'undefined') return;
	if (lockCount === 0) {
		previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	}
	lockCount++;
}

export function unlockScroll() {
	if (typeof document === 'undefined') return;
	lockCount = Math.max(0, lockCount - 1);
	if (lockCount === 0) {
		document.body.style.overflow = previousOverflow;
	}
}
