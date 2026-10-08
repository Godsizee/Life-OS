import { toISODate } from '#lib/core/date.js';
import { parseRelativeDate } from '#lib/core/nlp-parse.js';

export interface ParsedTaskInput {
	title: string;
	priority: 'low' | 'medium' | 'high';
	/** Frist (Muss): ISO-Zeitpunkt, ohne Uhrzeit das Tagesende (23:59) in lokaler Zeit. */
	due_at: string | null;
	/** Absicht: der Tag, an dem ich es tun will ('yyyy-mm-dd'). */
	planned_for: string | null;
	/** Geschätzte Dauer in Minuten. */
	estimate_min: number | null;
	/** Zeitblock am geplanten Tag (ISO), nur zusammen mit `planned_for`. */
	scheduled_start: string | null;
	project_name: string | null;
	labels: string[];
	rrule: string | null;
}

const WORD = '[\\wäöüßÄÖÜ-]+';

const WOCHENTAG =
	'montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|monday|tuesday|wednesday|thursday|friday|saturday|sunday';
/** Tageswort, Wochentag (voll ausgeschrieben), `dd.mm.` mit Schlusspunkt oder ISO-Datum. Kurzformen wie „so“ oder „do“ sind zu mehrdeutig. */
// `\b` kennt keine Umlaute („übermorgen“): Grenzen deshalb per Lookaround.
const L = String.raw`(?<![\wäöüßÄÖÜ])`;
const R = String.raw`(?![\wäöüßÄÖÜ])`;
const TAG = String.raw`(?:(?:am|nächsten|nächster|kommenden)\s+)?(?:(?:übermorgen|morgen|heute|today|tomorrow|${WOCHENTAG})${R}|\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.(?:\d{2,4})?)`;
const UHRZEIT = String.raw`(?:(?:um\s+)?(\d{1,2})(?::(\d{2}))?\s*uhr\b|um\s+(\d{1,2})(?::(\d{2}))?\b|(\d{1,2}):(\d{2})\b)`;
const RE_FRIST = new RegExp(
	String.raw`\b(?:bis|fällig|frist|due|deadline|spätestens)\s+(${TAG})(?:\s+${UHRZEIT})?`,
	'i'
);
const RE_TAG = new RegExp(`${L}${TAG}`, 'i');
const RE_UHRZEIT = new RegExp(`${L}${UHRZEIT}`, 'i');

function uhrzeit(m: RegExpMatchArray, ab: number): [number, number] | null {
	const std = m[ab] ?? m[ab + 2] ?? m[ab + 4];
	if (std === undefined) return null;
	const min = m[ab + 1] ?? m[ab + 3] ?? m[ab + 5] ?? '0';
	const h = Number(std);
	const mi = Number(min);
	return h <= 23 && mi <= 59 ? [h, mi] : null;
}

function tagVon(wort: string): Date | null {
	return parseRelativeDate(wort.toLowerCase());
}

function entferne(text: string, treffer: RegExpMatchArray): string {
	return text.slice(0, treffer.index!) + ' ' + text.slice(treffer.index! + treffer[0].length);
}

/** Dauer aus `30min`, `2h`, `1,5h` oder `1h30min`. */
function dauer(text: string): { min: number; rest: string } | null {
	const kombi = text.match(
		/\b(\d+(?:[.,]\d+)?)\s*(?:h|std|stunden?)(?![a-zäöüß])(?:\s*(\d{1,2})\s*(?:min|minuten?)\b)?/i
	);
	if (kombi) {
		const min = Math.round(Number(kombi[1].replace(',', '.')) * 60) + Number(kombi[2] ?? 0);
		return { min, rest: entferne(text, kombi) };
	}
	const nurMin = text.match(/\b(\d+)\s*(?:min|minuten?)\b/i);
	if (nurMin) return { min: Number(nurMin[1]), rest: entferne(text, nurMin) };
	return null;
}

export function parseTaskInput(text: string): ParsedTaskInput {
	const trimmed = text.trim();
	let rest = trimmed;

	let priority: 'low' | 'medium' | 'high' = 'medium';
	if (
		/!(high|hoch|wichtig|dringend|urgent|critical|kritisch|asap|schnell)/i.test(trimmed) ||
		/\bp1\b/i.test(trimmed) ||
		/^!!/.test(trimmed) ||
		trimmed.includes('‼️')
	)
		priority = 'high';
	else if (/!(low|niedrig|später|irgendwann)/i.test(trimmed) || /\bp3\b/i.test(trimmed))
		priority = 'low';
	rest = rest
		.replace(
			/!(high|medium|low|hoch|mittel|niedrig|wichtig|dringend|urgent|critical|kritisch|asap|schnell|später|irgendwann)/gi,
			''
		)
		.replace(/\bp[123]\b/gi, '')
		.replace(/^!!/, '');

	// Reihenfolge ist wichtig: erst Frist und Dauer herauslösen, damit „1.5 h“ oder „bis 14:00“ nicht als Plantag gelten.
	let due_at: string | null = null;
	const frist = rest.match(RE_FRIST);
	if (frist) {
		const d = tagVon(frist[1]);
		if (d) {
			const zeit = uhrzeit(frist, 2);
			d.setHours(zeit ? zeit[0] : 23, zeit ? zeit[1] : 59, 0, 0);
			due_at = d.toISOString();
			rest = entferne(rest, frist);
		}
	}

	let estimate_min: number | null = null;
	const d = dauer(rest);
	if (d) {
		estimate_min = d.min >= 1 && d.min <= 1440 ? d.min : null;
		rest = d.rest;
	}

	let planned_for: string | null = null;
	let scheduled_start: string | null = null;
	const tag = rest.match(RE_TAG);
	if (tag) {
		// „am Montag“ heißt hier der nächste Montag; parseRelativeDate springt bei „am …“ eine Woche weiter.
		const datum = tagVon(tag[0].replace(/^am\s+/i, ''));
		if (datum) {
			planned_for = toISODate(datum);
			rest = entferne(rest, tag);
			const zeit = rest.match(RE_UHRZEIT);
			const hm = zeit ? uhrzeit(zeit, 1) : null;
			if (zeit && hm) {
				datum.setHours(hm[0], hm[1], 0, 0);
				scheduled_start = datum.toISOString();
				rest = entferne(rest, zeit);
			}
		}
	}

	const projectMatch = rest.match(new RegExp(`#(${WORD})`));
	const project_name = projectMatch ? projectMatch[1] : null;
	const labels = Array.from(rest.matchAll(new RegExp(`@(${WORD})`, 'g')), (m) => m[1]);

	const lower = rest.toLowerCase();
	const isRecurring =
		/\b(täglich|daily|wöchentlich|weekly|jeden\s+tag|jede\s+woche|monatlich)\b/i.test(lower);
	const rrule = !isRecurring
		? null
		: /\b(wöchentlich|weekly|jede\s+woche)\b/i.test(lower)
			? 'FREQ=WEEKLY'
			: /\bmonatlich\b/i.test(lower)
				? 'FREQ=MONTHLY'
				: 'FREQ=DAILY';

	// Wiederholung rechnet mit der Frist (tasks/recurrence.ts): ohne ausdrückliche Frist zieht sie den Plantag mit.
	if (rrule && !due_at && planned_for) {
		const tagesende = new Date(`${planned_for}T23:59:00`);
		due_at = tagesende.toISOString();
	}

	const cleanTitle = rest
		.replace(new RegExp(`#${WORD}`, 'g'), '')
		.replace(new RegExp(`@${WORD}`, 'g'), '')
		.replace(/\b(täglich|daily|wöchentlich|weekly|jeden\s+tag|jede\s+woche|monatlich)\b/gi, '')
		.replace(/\s+/g, ' ')
		.trim();

	return {
		title: cleanTitle || trimmed,
		priority,
		due_at,
		planned_for,
		estimate_min,
		scheduled_start,
		project_name,
		labels,
		rrule
	};
}
