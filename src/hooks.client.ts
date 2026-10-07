import type { HandleClientError } from '@sveltejs/kit/hooks';

/**
 * Letzte Instanz fuer Fehler, die beim Navigieren oder Rendern hochblubbern.
 *
 * Ohne diesen Haken zeigt SvelteKit seine eigene Fehlerseite: englisch, ohne
 * Navigation, ohne Weg zurueck. Die zurueckgegebene `message` landet in
 * `page.error` und damit in `routes/+error.svelte`.
 *
 * Kit 3 reicht auch erwartete Fehler (`kind: 'framework'`, z. B. 404) hierher.
 */
export const handleError: HandleClientError = ({ kind, error, event }) => {
	// 404 ist erwartbar und kein Defekt — nicht als Absturz protokollieren.
	if (kind === 'framework' && error.status === 404) return;

	console.error('[app] Unbehandelter Fehler', {
		pfad: event.url.pathname,
		art: kind,
		error
	});

	return { message: 'Die Seite konnte nicht geladen werden.' };
};
