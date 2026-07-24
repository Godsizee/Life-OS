import { parseRelativeDate } from '$lib/core/nlp-parse';

export interface ParsedTaskInput {
	title: string;
	priority: 'low' | 'medium' | 'high';
	due_at: string | null;
	project_name: string | null;
	labels: string[];
	rrule: string | null;
}

const WORD = '[\\wäöüßÄÖÜ-]+';

export function parseTaskInput(text: string): ParsedTaskInput {
	const trimmed = text.trim();
	const lower = trimmed.toLowerCase();

	let priority: 'low' | 'medium' | 'high' = 'medium';
	if (/!(high|hoch|wichtig|dringend|urgent|critical|kritisch|asap|schnell)/i.test(trimmed)
			|| /^!!/.test(trimmed) || trimmed.includes('‼️')) priority = 'high';
	else if (/!(low|niedrig|später|irgendwann)/i.test(trimmed)) priority = 'low';

	let due_at: string | null = null;
	if (/\b(bis|due|fällig|deadline|spätestens)\b/i.test(lower)) {
		const afterDue = lower.replace(/.*?\b(?:bis|due|fällig|deadline|spätestens)\s*/i, '').trim();
		const d = parseRelativeDate(afterDue);
		if (d) due_at = d.toISOString();
	}
	if (!due_at) {
		const d = parseRelativeDate(lower);
		if (d) due_at = d.toISOString();
	}

	const projectMatch = trimmed.match(new RegExp(`#(${WORD})`));
	const project_name = projectMatch ? projectMatch[1] : null;

	const labels = Array.from(trimmed.matchAll(new RegExp(`@(${WORD})`, 'g')), (m) => m[1]);

	const isRecurring = /\b(täglich|daily|wöchentlich|weekly|jeden\s+tag|jede\s+woche|monatlich)\b/i.test(lower);
	const rrule = !isRecurring ? null
		: /\b(wöchentlich|weekly|jede\s+woche)\b/i.test(lower) ? 'FREQ=WEEKLY'
		: /\bmonatlich\b/i.test(lower) ? 'FREQ=MONTHLY'
		: 'FREQ=DAILY';

	const cleanTitle = trimmed
		.replace(/!(high|medium|low|hoch|mittel|niedrig|wichtig|dringend|urgent|critical|kritisch|asap|schnell|später|irgendwann)/gi, '')
		.replace(/^!!/, '')
		.replace(new RegExp(`#${WORD}`, 'g'), '')
		.replace(new RegExp(`@${WORD}`, 'g'), '')
		.replace(/\b(bis|due|fällig|deadline|spätestens)\s+\S+/gi, '')
		.replace(/\b(täglich|daily|wöchentlich|weekly|jeden\s+tag|jede\s+woche|monatlich)\b/gi, '')
		.replace(/\b(heute|morgen|übermorgen|today|tomorrow)\b/gi, '')
		.replace(/\s+/g, ' ').trim();

	return { title: cleanTitle || trimmed, priority, due_at, project_name, labels, rrule };
}
