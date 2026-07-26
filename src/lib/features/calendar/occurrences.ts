import { toISODate } from '$lib/core/date';
import type { Event, EventOverride, EventOverridePatch } from './types';

/** Eine konkrete Ausprägung eines (ggf. wiederkehrenden) Termins an einem Tag. */
export interface Occurrence {
	/** Stabiler Schlüssel `${event.id}:${occurrenceDate}` — für keyed {#each}. */
	key: string;
	event: Event;
	/** yyyy-mm-dd des URSPRÜNGLICHEN Slots — Override-Nachschlage-Schlüssel. */
	occurrenceDate: string;
	start: string; // ISO datetime (nach Patch)
	end: string; // ISO datetime (nach Patch)
	allDay: boolean;
	title: string;
	location: string | null;
	overridden: boolean; // true, wenn ein Patch-Override angewandt wurde
	recurring: boolean; // true, wenn der Event eine RRULE hat
}

interface ParsedRule {
	freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
	interval: number;
	count: number | null;
	until: Date | null; // inklusiv
	byday: number[] | null; // JS getDay(): 0=So..6=Sa; nur WEEKLY
}

const DAY_CODE: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const MAX_SLOTS = 750; // Sicherheitskappe je Event

export function parseRrule(rrule: string | null): ParsedRule | null {
	if (!rrule) return null;
	const body = rrule.replace(/^RRULE:/i, '');
	const parts: Record<string, string> = {};
	for (const seg of body.split(';')) {
		const [k, v] = seg.split('=');
		if (k) parts[k.trim().toUpperCase()] = (v ?? '').trim().toUpperCase();
	}
	const freq = parts.FREQ as ParsedRule['freq'];
	if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY') return null;
	const interval = Math.max(1, parseInt(parts.INTERVAL ?? '1', 10) || 1);
	const count = parts.COUNT ? Math.max(1, parseInt(parts.COUNT, 10) || 1) : null;
	let until: Date | null = null;
	if (parts.UNTIL) {
		const m = parts.UNTIL.match(/^(\d{4})(\d{2})(\d{2})/);
		if (m) until = new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59, 999);
	}
	let byday: number[] | null = null;
	if (parts.BYDAY) {
		byday = parts.BYDAY.split(',')
			.map((c) => DAY_CODE[c.trim().slice(-2)])
			.filter((n): n is number => n !== undefined);
		if (byday.length === 0) byday = null;
	}
	return { freq, interval, count, until, byday };
}

function addDays(d: Date, n: number): Date {
	const x = new Date(d);
	x.setDate(x.getDate() + n);
	return x;
}
function addMonths(d: Date, n: number): Date {
	const x = new Date(d);
	x.setMonth(x.getMonth() + n);
	return x;
}
function startOfDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
/** Montag der Woche von d (lokal). */
function startOfWeekMon(d: Date): Date {
	const s = startOfDay(d);
	const dow = (s.getDay() + 6) % 7; // Mo=0..So=6
	return addDays(s, -dow);
}
/** Datum von `day` mit Uhrzeit von `time`. */
function withTime(day: Date, time: Date): Date {
	return new Date(
		day.getFullYear(),
		day.getMonth(),
		day.getDate(),
		time.getHours(),
		time.getMinutes(),
		time.getSeconds(),
		time.getMilliseconds()
	);
}

/** Slot-Startzeitpunkte eines Events im Fenster [rangeStart, rangeEnd] (inkl. Ausläufer). */
function expandSlots(event: Event, rangeStart: Date, rangeEnd: Date): Date[] {
	const start0 = new Date(event.start);
	if (isNaN(start0.getTime())) return [];
	const rule = parseRrule(event.rrule);

	if (!rule) {
		const end0 = new Date(event.end);
		const end = isNaN(end0.getTime()) ? start0 : end0;
		return end >= rangeStart && start0 <= rangeEnd ? [start0] : [];
	}

	const out: Date[] = [];
	let emitted = 0;

	if (rule.freq === 'WEEKLY' && rule.byday) {
		let weekStart = startOfWeekMon(start0);
		for (let guard = 0; guard < MAX_SLOTS * 2; guard++) {
			for (let i = 0; i < 7; i++) {
				const day = addDays(weekStart, i);
				if (day < startOfDay(start0)) continue;
				if (!rule.byday.includes(day.getDay())) continue;
				const s = withTime(day, start0);
				if (rule.until && s > rule.until) return out;
				if (s > rangeEnd) return out;
				if (rule.count && emitted >= rule.count) return out;
				emitted++;
				if (s >= startOfDay(rangeStart)) out.push(s);
				if (out.length >= MAX_SLOTS) return out;
			}
			weekStart = addDays(weekStart, 7 * rule.interval);
		}
		return out;
	}

	let cursor = new Date(start0);
	for (let guard = 0; guard < MAX_SLOTS; guard++) {
		if (rule.until && cursor > rule.until) break;
		if (cursor > rangeEnd) break;
		if (rule.count && emitted >= rule.count) break;
		emitted++;
		if (cursor >= startOfDay(rangeStart)) out.push(new Date(cursor));
		if (rule.freq === 'DAILY') cursor = addDays(cursor, rule.interval);
		else if (rule.freq === 'WEEKLY') cursor = addDays(cursor, 7 * rule.interval);
		else cursor = addMonths(cursor, rule.interval);
	}
	return out;
}

/**
 * Expandiert Events + Overrides zu konkreten Occurrences im Fenster.
 * rangeStart/rangeEnd sind lokale Date-Grenzen (inklusiv).
 */
export function expandEvents(
	events: Event[],
	overrides: EventOverride[],
	rangeStart: Date,
	rangeEnd: Date
): Occurrence[] {
	const byEvent = new Map<string, Map<string, EventOverride>>();
	for (const o of overrides) {
		if (!byEvent.has(o.event_id)) byEvent.set(o.event_id, new Map());
		byEvent.get(o.event_id)!.set(o.occurrence_date, o);
	}

	const result: Occurrence[] = [];
	for (const event of events) {
		const durationMs = Math.max(0, new Date(event.end).getTime() - new Date(event.start).getTime());
		const ov = byEvent.get(event.id);
		for (const slotStart of expandSlots(event, rangeStart, rangeEnd)) {
			const occDate = toISODate(slotStart);
			const o = ov?.get(occDate);
			if (o?.cancelled) continue;

			let start = slotStart;
			let end = new Date(slotStart.getTime() + durationMs);
			let title = event.title;
			let location = event.location;
			let overridden = false;
			const patch: EventOverridePatch | undefined = o?.patch;
			if (patch && Object.keys(patch).length > 0) {
				overridden = true;
				if (patch.start) start = new Date(patch.start);
				if (patch.end) end = new Date(patch.end);
				if (typeof patch.title === 'string') title = patch.title;
				if (patch.location !== undefined) location = patch.location;
			}
			if (end < rangeStart || start > rangeEnd) continue;

			result.push({
				key: `${event.id}:${occDate}`,
				event,
				occurrenceDate: occDate,
				start: start.toISOString(),
				end: end.toISOString(),
				allDay: event.all_day,
				title,
				location,
				overridden,
				recurring: !!event.rrule
			});
		}
	}
	return result.sort((a, b) => a.start.localeCompare(b.start));
}
