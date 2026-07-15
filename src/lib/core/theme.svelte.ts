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
			// Ohne gespeicherte Präferenz folgt die App live dem OS-Theme.
			const mql = window.matchMedia('(prefers-color-scheme: dark)');
			mql.addEventListener('change', (e) => {
				if (localStorage.getItem('theme')) return;
				isDark = e.matches;
				apply();
			});
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
		// Status-Bar-Farbe der installierten PWA synchron zum Theme halten.
		const meta = document.getElementById('theme-color-meta');
		if (meta) meta.setAttribute('content', isDark ? '#0E0E12' : '#F6F6F8');
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
