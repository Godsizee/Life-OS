/**
 * theme.svelte.ts
 * Runes-basierter Hell/Dunkel-Zustand. Quelle ist die Geräte-Einstellung `darstellung.thema`
 * (`system` | `hell` | `dunkel`); das Inline-Skript in app.html setzt <html class="dark"> schon vor dem
 * ersten Rendern, dieser Zustand hält es danach synchron.
 */
import { geraet } from './geraet.svelte.js';

export type ThemaModus = 'system' | 'hell' | 'dunkel';

export const THEMA_SCHLUESSEL = 'darstellung.thema';
const ALT_SCHLUESSEL = 'theme'; // vor T301: 'dark' | 'light'

const istModus = (v: unknown): v is ThemaModus => v === 'system' || v === 'hell' || v === 'dunkel';

function createThemeState() {
	let isDark = $state(false);
	let mql: MediaQueryList | null = null;

	function modus(): ThemaModus {
		const v = geraet.lesen(THEMA_SCHLUESSEL);
		return istModus(v) ? v : 'system';
	}

	/** Übernimmt den Alt-Schlüssel `theme` einmalig und löscht ihn. */
	function uebernehmeAlt() {
		try {
			const alt = localStorage.getItem(ALT_SCHLUESSEL);
			if (alt === null) return;
			if (!istModus(geraet.lesen(THEMA_SCHLUESSEL)) && (alt === 'dark' || alt === 'light')) {
				void geraet.schreiben({ [THEMA_SCHLUESSEL]: alt === 'dark' ? 'dunkel' : 'hell' });
			}
			localStorage.removeItem(ALT_SCHLUESSEL);
		} catch {
			// Privatmodus: der Alt-Wert bleibt, schadet nicht.
		}
	}

	function berechne() {
		const m = modus();
		isDark = m === 'dunkel' || (m === 'system' && (mql?.matches ?? false));
	}

	function apply() {
		if (typeof document === 'undefined') return;
		document.documentElement.classList.toggle('dark', isDark);
		// Status-Bar-Farbe der installierten PWA synchron zum Thema halten.
		const meta = document.getElementById('theme-color-meta');
		if (meta) meta.setAttribute('content', isDark ? '#141414' : '#FFF4E0');
	}

	function init() {
		if (typeof window === 'undefined') return;
		uebernehmeAlt();
		mql = window.matchMedia('(prefers-color-scheme: dark)');
		// Im Modus `system` folgt die App live dem OS.
		mql.addEventListener('change', () => {
			if (modus() !== 'system') return;
			berechne();
			apply();
		});
		berechne();
		apply();
	}

	async function setzeModus(neu: ThemaModus) {
		await geraet.schreiben({ [THEMA_SCHLUESSEL]: neu });
		berechne();
		apply();
	}

	function toggle() {
		return setzeModus(isDark ? 'hell' : 'dunkel');
	}

	return {
		get isDark() {
			return isDark;
		},
		get modus() {
			return modus();
		},
		init,
		setzeModus,
		toggle
	};
}

export const themeState = createThemeState();
