import { APP_LOCALE } from './locale';

export function toISODate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** Format a Date or ISO string for display using the app locale. */
export function formatDate(
	date: Date | string,
	opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString(APP_LOCALE, opts);
}

/** Short date: "08.07.2026" */
export function formatShortDate(date: Date | string): string {
	return formatDate(date, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Lokale Mitternacht eines 'yyyy-mm-dd'-Datums (nicht UTC). Ungültig -> null. */
export function fromISODate(iso: string): Date | null {
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	if (!m) return null;
	const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
	return Number.isNaN(d.getTime()) ? null : d;
}
