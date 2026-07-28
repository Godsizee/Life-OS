import type { Reminder } from './types';

/** ICS-Wochentagscodes, Index = JS getDay() (0 = So … 6 = Sa). */
const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

export interface ReminderRule {
	freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
	interval: number;
	/** JS-Wochentage (0 = So … 6 = Sa); nur bei WEEKLY, sonst null. */
	byday: number[] | null;
}

/** Parst das unterstützte RRULE-Subset. Unbekanntes → null (= einmalig). */
export function parseReminderRrule(rrule: string | null): ReminderRule | null {
	if (!rrule) return null;
	const body = rrule.replace(/^RRULE:/i, '').toUpperCase();
	const parts: Record<string, string> = {};
	for (const seg of body.split(';')) {
		const [k, v] = seg.split('=');
		if (k) parts[k.trim()] = (v ?? '').trim();
	}
	const freq = parts.FREQ as ReminderRule['freq'];
	if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY') return null;
	const interval = Math.max(1, parseInt(parts.INTERVAL ?? '1', 10) || 1);
	let byday: number[] | null = null;
	if (parts.BYDAY) {
		byday = parts.BYDAY.split(',')
			.map((c) => DAY_CODES.indexOf(c.trim().slice(-2) as (typeof DAY_CODES)[number]))
			.filter((n) => n >= 0)
			.sort((a, b) => a - b);
		if (byday.length === 0) byday = null;
	}
	return { freq, interval, byday };
}

/** Baut eine RRULE aus einem Habit-Schedule (JS-Wochentage). */
export function buildRrule(schedule: { type: 'daily' } | { type: 'weekly'; days: number[] }): string {
	if (schedule.type === 'daily') return 'RRULE:FREQ=DAILY';
	const days = [...schedule.days].sort((a, b) => a - b).map((d) => DAY_CODES[d]);
	return days.length > 0 ? `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')}` : 'RRULE:FREQ=WEEKLY';
}

/**
 * Nächste Ausprägung nach `from` — Spiegel von public.next_reminder_occurrence().
 * Rechnet in lokaler Zeit (Annahme: Browser-TZ = Europe/Berlin), damit die
 * Uhrzeit über die Zeitumstellung stabil bleibt.
 */
export function nextOccurrence(fromIso: string, rrule: string | null): string | null {
	const rule = parseReminderRrule(rrule);
	if (!rule) return null;
	const from = new Date(fromIso);
	if (isNaN(from.getTime())) return null;

	const next = new Date(from);
	if (rule.freq === 'DAILY') {
		next.setDate(next.getDate() + rule.interval);
	} else if (rule.freq === 'WEEKLY' && rule.byday) {
		for (let i = 1; i <= 7; i++) {
			const cand = new Date(from);
			cand.setDate(cand.getDate() + i);
			if (rule.byday.includes(cand.getDay())) return cand.toISOString();
		}
		next.setDate(next.getDate() + 7 * rule.interval);
	} else if (rule.freq === 'WEEKLY') {
		next.setDate(next.getDate() + 7 * rule.interval);
	} else {
		next.setMonth(next.getMonth() + rule.interval);
	}
	return next.toISOString();
}

/** Spult eine Regel vor, bis der Zeitpunkt in der Zukunft liegt (max. 400 Schritte). */
export function firstFutureOccurrence(
	startIso: string,
	rrule: string | null,
	now: Date = new Date()
): string {
	let current = startIso;
	if (new Date(current) > now) return current;
	for (let i = 0; i < 400; i++) {
		const next = nextOccurrence(current, rrule);
		if (!next) return current;
		current = next;
		if (new Date(current) > now) return current;
	}
	return current;
}

/** Ankerzeit (z. B. Terminbeginn) minus Vorlauf → ISO. */
export function reminderAtFromAnchor(anchorIso: string, offsetMinutes: number): string {
	const anchor = new Date(anchorIso);
	if (isNaN(anchor.getTime())) return new Date().toISOString();
	return new Date(anchor.getTime() - offsetMinutes * 60_000).toISOString();
}

/** Lokales Datum (yyyy-mm-dd) + Uhrzeit (HH:MM) → ISO (UTC). */
export function reminderAtOnDate(dateIso: string, time: string): string {
	const [y, m, d] = dateIso.split('-').map(Number);
	const [hh, mm] = time.split(':').map(Number);
	return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 9, mm ?? 0, 0, 0).toISOString();
}

/** Label für Vorlauf-Chips. */
export function offsetLabel(minutes: number): string {
	if (minutes === 0) return 'pünktlich';
	if (minutes < 60) return `${minutes} Min vorher`;
	if (minutes < 1440) return `${minutes / 60} Std vorher`;
	return minutes === 1440 ? '1 Tag vorher' : `${minutes / 1440} Tage vorher`;
}

const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** Anzeigetext: „Mo, Mi um 07:30" bzw. „28.07.2026 um 09:00". */
export function formatReminder(reminder: Pick<Reminder, 'remind_at' | 'rrule'>): string {
	const at = new Date(reminder.remind_at);
	const time = at.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	const rule = parseReminderRrule(reminder.rrule);
	if (!rule) {
		return `${at.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} um ${time}`;
	}
	if (rule.freq === 'DAILY') return `täglich um ${time}`;
	if (rule.freq === 'MONTHLY') return `monatlich um ${time}`;
	if (rule.byday) return `${rule.byday.map((d) => WEEKDAY_SHORT[d]).join(', ')} um ${time}`;
	return `wöchentlich um ${time}`;
}

/** Fällig = aktiv und Zeitpunkt erreicht. */
export function isDue(reminder: Pick<Reminder, 'remind_at' | 'active'>, now: Date = new Date()): boolean {
	return reminder.active && new Date(reminder.remind_at).getTime() <= now.getTime();
}

/** Fällt der Reminder auf `day` (lokal)? — für die Dashboard-Zählung. */
export function isOnDay(reminder: Pick<Reminder, 'remind_at' | 'active'>, day: Date = new Date()): boolean {
	if (!reminder.active) return false;
	const at = new Date(reminder.remind_at);
	return (
		at.getFullYear() === day.getFullYear() &&
		at.getMonth() === day.getMonth() &&
		at.getDate() === day.getDate()
	);
}
