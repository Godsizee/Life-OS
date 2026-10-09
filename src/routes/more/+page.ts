import { redirect } from '@sveltejs/kit';

// „Mehr“ gibt es nicht mehr: Module stehen im Blatt „Alle Module“, der Rest in den Einstellungen.
export const load = () => redirect(308, '/settings');
