export type Freq = 'none' | 'daily' | 'weekly' | 'monthly';
export type Ende = 'nie' | 'am' | 'nach';

export interface RecurrenceForm {
	freq: Freq;
	/** Alle n Tage/Wochen/Monate. */
	interval: number;
	/** JS-Wochentage (0 = So … 6 = Sa); nur bei freq === 'weekly'. Leer = Wochentag des Starts. */
	byday: number[];
	ende: Ende;
	/** yyyy-mm-dd, nur bei ende === 'am'. */
	until: string | null;
	/** Anzahl Termine, nur bei ende === 'nach'. */
	count: number | null;
}

export const LEERE_REGEL: RecurrenceForm = {
	freq: 'none', interval: 1, byday: [], ende: 'nie', until: null, count: null
};

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

/** Formularzustand → RRULE. null bei freq === 'none'. */
export function buildRrule(form: RecurrenceForm): string | null {
	if (form.freq === 'none') return null;
	const teile = [`FREQ=${form.freq.toUpperCase()}`];
	if (form.interval > 1) teile.push(`INTERVAL=${form.interval}`);
	if (form.freq === 'weekly' && form.byday.length > 0) {
		teile.push(`BYDAY=${[...form.byday].sort((a, b) => a - b).map((d) => DAY_CODES[d]).join(',')}`);
	}
	if (form.ende === 'am' && form.until) teile.push(`UNTIL=${form.until.replace(/-/g, '')}`);
	if (form.ende === 'nach' && form.count && form.count > 0) teile.push(`COUNT=${form.count}`);
	return `RRULE:${teile.join(';')}`;
}

/**
 * RRULE → Formularzustand. Muss VERLUSTFREI zu buildRrule() zurückführen,
 * sonst überschreibt ein Bearbeiten die Regel (K-01).
 */
export function parseRrule(rrule: string | null): RecurrenceForm {
	if (!rrule || !rrule.startsWith('RRULE:')) return { ...LEERE_REGEL };
	
	const form: RecurrenceForm = { ...LEERE_REGEL };
	const body = rrule.slice(6);
	const parts = body.split(';');
	
	for (const part of parts) {
		const [key, value] = part.split('=');
		if (!key || !value) continue;
		
		switch (key) {
			case 'FREQ':
				const freqLower = value.toLowerCase();
				if (freqLower === 'daily' || freqLower === 'weekly' || freqLower === 'monthly') {
					form.freq = freqLower as Freq;
				}
				break;
			case 'INTERVAL':
				form.interval = parseInt(value, 10) || 1;
				break;
			case 'BYDAY':
				const days = value.split(',');
				form.byday = days.map(d => DAY_CODES.indexOf(d as any)).filter(i => i !== -1);
				break;
			case 'UNTIL':
				if (value.length >= 8) {
					form.ende = 'am';
					form.until = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
				}
				break;
			case 'COUNT':
				form.ende = 'nach';
				form.count = parseInt(value, 10);
				break;
		}
	}
	
	return form;
}

const GERMAN_DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** Beschriftung für Listen: „alle 2 Wochen, Di", „monatlich bis 31.12.2026". */
export function formatRecurrence(rrule: string | null): string {
	if (!rrule) return 'einmalig';
	const form = parseRrule(rrule);
	if (form.freq === 'none') return 'einmalig';
	
	let freqText = '';
	if (form.freq === 'daily') freqText = form.interval > 1 ? `alle ${form.interval} Tage` : 'täglich';
	else if (form.freq === 'weekly') {
		freqText = form.interval > 1 ? `alle ${form.interval} Wochen` : 'wöchentlich';
		if (form.byday.length > 0) {
			const dayNames = [...form.byday].sort((a, b) => a - b).map(d => GERMAN_DAYS[d]);
			freqText += `, ${dayNames.join(', ')}`;
		}
	}
	else if (form.freq === 'monthly') freqText = form.interval > 1 ? `alle ${form.interval} Monate` : 'monatlich';
	
	let endeText = '';
	if (form.ende === 'am' && form.until) {
		const [y, m, d] = form.until.split('-');
		endeText = ` bis ${d}.${m}.${y}`;
	} else if (form.ende === 'nach' && form.count) {
		endeText = ` (${form.count} Termine)`;
	}
	
	return `${freqText}${endeText}`;
}
