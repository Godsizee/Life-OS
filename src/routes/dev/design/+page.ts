import { error } from '@sveltejs/kit';
import { dev } from '$app/env';

// Der Styleguide ist ein Entwicklungswerkzeug: im Produktions-Build gibt es ihn nicht.
export const load = () => {
	if (!dev) error(404, 'Nicht gefunden');
};
