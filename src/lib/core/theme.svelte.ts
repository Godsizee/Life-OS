/**
 * theme.svelte.ts
 * Runes-basierter Dark-Mode-State.
 * Setzt/liest <html class="dark">, speichert in localStorage.
 */

function createThemeState() {
	let isDark = $state(false);

	function init() {
		if (typeof window === 'undefined') return;
		const stored = localStorage.getItem('theme');
		if (stored) {
			isDark = stored === 'dark';
		} else {
			isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		apply();
	}

	function apply() {
		if (typeof document === 'undefined') return;
		if (isDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function toggle() {
		isDark = !isDark;
		try {
			localStorage.setItem('theme', isDark ? 'dark' : 'light');
		} catch {
			// Safari private mode: ignore
		}
		apply();
	}

	return {
		get isDark() { return isDark; },
		init,
		toggle
	};
}

export const themeState = createThemeState();
