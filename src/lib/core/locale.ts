/**
 * Zentrale Locale-Konstante für das gesamte Projekt.
 * Nie direkt 'de-DE' hardcoden – immer diesen Import verwenden.
 */
export const APP_LOCALE = 'de-DE' as const;

/** Formatiert ein Datum als kurzen String (z.B. "Mi., 8. Juli") */
export function formatLocalDate(
	date: Date | string,
	options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'long' }
): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString(APP_LOCALE, options);
}

/** Formatiert eine Uhrzeit als HH:MM */
export function formatLocalTime(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleTimeString(APP_LOCALE, { hour: '2-digit', minute: '2-digit' });
}

/** Formatiert Datum + Uhrzeit */
export function formatLocalDateTime(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleString(APP_LOCALE, {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	});
}
