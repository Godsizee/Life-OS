/**
 * Label-only helper - no RRULE parsing/expansion. Occurrence expansion lives
 * server-side (Edge Function, M4); the client only stores and displays it.
 */
export function formatRrule(rrule: string | null): string {
	if (!rrule) return 'einmalig';
	if (rrule.includes('FREQ=DAILY')) return 'täglich';
	if (rrule.includes('FREQ=WEEKLY')) return 'wöchentlich';
	return 'wiederholt sich';
}
