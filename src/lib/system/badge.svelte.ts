import { toISODate } from '#lib/core/date.js';
import { tasksState } from '#lib/features/tasks/store.svelte.js';
import { badgeZahl, type BadgeModus } from './badge-zahl.js';

type BadgeNavigator = Navigator & {
	setAppBadge?: (n?: number) => Promise<void>;
	clearAppBadge?: () => Promise<void>;
};

/**
 * Hält die Zahl auf dem App-Icon aktuell (Badging-API; iOS nur in der installierten App).
 * Liefert eine Aufräumfunktion für das Layout.
 */
export function starteAppBadge(modus: BadgeModus = 'heute'): () => void {
	const nav = navigator as BadgeNavigator;
	if (!nav.setAppBadge) return () => {};

	// Nicht beim Start einfrieren: Bleibt die App über Mitternacht offen, zählt sie sonst gestern (Falle F14).
	let heute = $state(toISODate(new Date()));
	const tick = () => (heute = toISODate(new Date()));
	const timer = setInterval(tick, 60_000);
	document.addEventListener('visibilitychange', tick);

	const stoppeEffekt = $effect.root(() => {
		$effect(() => {
			const n = badgeZahl(tasksState.tasks, heute, modus);
			const ergebnis = n > 0 ? nav.setAppBadge?.(n) : nav.clearAppBadge?.();
			// Ohne Berechtigung oder außerhalb der installierten App lehnt der Browser ab — kein Fehlerfall.
			ergebnis?.catch(() => {});
		});
	});

	return () => {
		stoppeEffekt();
		clearInterval(timer);
		document.removeEventListener('visibilitychange', tick);
	};
}
