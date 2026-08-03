import type { HandleClientError } from '@sveltejs/kit';

/**
 * Letzte Instanz fuer Fehler, die beim Navigieren oder Rendern hochblubbern.
 *
 * Ohne diesen Haken zeigt SvelteKit seine eigene Fehlerseite: englisch, ohne
 * Navigation, ohne Weg zurueck. Die zurueckgegebene `message` landet in
 * `page.error` und damit in `routes/+error.svelte`.
 */
export const handleError: HandleClientError = ({ error, event, status, message }) => {
	// 404 ist erwartbar und kein Defekt — nicht als Absturz protokollieren.
	if (status !== 404) {
		console.error('[app] Unbehandelter Fehler', {
			pfad: event.url.pathname,
			status,
			error
		});
	}

	return {
		message: status === 404 ? message : 'Die Seite konnte nicht geladen werden.'
	};
};
