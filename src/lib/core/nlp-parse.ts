import { habitsState } from '$lib/features/habits/store.svelte';

export interface ParsedInput {
	type: 'task' | 'event' | 'shopping' | 'health' | 'habit' | 'mood' | 'note' | 'goal';
	parsed: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const DAY_MAP: Record<string, number> = {
	montag: 1, monday: 1, mo: 1,
	dienstag: 2, tuesday: 2, di: 2, tue: 2,
	mittwoch: 3, wednesday: 3, mi: 3, wed: 3,
	donnerstag: 4, thursday: 4, do: 4, thu: 4,
	freitag: 5, friday: 5, fr: 5, fri: 5,
	samstag: 6, saturday: 6, sa: 6, sat: 6,
	sonntag: 0, sunday: 0, so: 0, sun: 0
};

function nextWeekday(target: number, weekOffset: number = 0): Date {
	const d = new Date();
	const currentDay = d.getDay();
	let distance = (target + 7 - currentDay) % 7;
	if (distance === 0 && weekOffset === 0) distance = 7;
	d.setDate(d.getDate() + distance + (weekOffset * 7));
	return d;
}

function parseRelativeDate(lower: string): Date | null {
	const now = new Date();

	if (/\b(\u00fcber\u00fcbermorgen|in 3 tagen)\b/.test(lower)) {
		const d = new Date(now); d.setDate(d.getDate() + 3); return d;
	}
	if (/\b(\u00fcbermorgen|day after tomorrow)\b/.test(lower)) {
		const d = new Date(now); d.setDate(d.getDate() + 2); return d;
	}
	if (/\b(morgen|tomorrow)\b/.test(lower)) {
		const d = new Date(now); d.setDate(d.getDate() + 1); return d;
	}
	if (/\b(heute|today)\b/.test(lower)) {
		return new Date(now);
	}
	if (/\b(n\u00e4chste\s*woche|next\s*week|kommende\s*woche)\b/.test(lower)) {
		return nextWeekday(1);
	}
	if (/\b(am\s*wochenende|wochenende|weekend)\b/.test(lower)) {
		return nextWeekday(6); // Returns next Saturday
	}
	
	const inDays = lower.match(/\bin\s*(\d+)\s*tag(?:en)?\b/);
	if (inDays) {
		const d = new Date(now); d.setDate(d.getDate() + parseInt(inDays[1])); return d;
	}
	const inWeeks = lower.match(/\bin\s*(\d+)\s*woch(?:en|e)?\b/);
	if (inWeeks) {
		const d = new Date(now); d.setDate(d.getDate() + parseInt(inWeeks[1]) * 7); return d;
	}
	const inHours = lower.match(/\bin\s*(\d+)\s*stunden?\b/);
	if (inHours) {
		const d = new Date(now); d.setHours(d.getHours() + parseInt(inHours[1])); return d;
	}

	const nextDayMatch = lower.match(/\b(?:n\u00e4chsten|n\u00e4chster|am|kommenden)\s+(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mo|di|mi|do|fr|sa|so)\b/);
	if (nextDayMatch && DAY_MAP[nextDayMatch[1]]) {
		return nextWeekday(DAY_MAP[nextDayMatch[1]], 1); // Jump 1 week ahead for "nächsten X" if needed, or simply standard nextWeekday which jumps correctly.
	}

	for (const [key, val] of Object.entries(DAY_MAP)) {
		const re = new RegExp(`\\b${key}\\b`);
		if (re.test(lower)) return nextWeekday(val);
	}

	const dmMatch = lower.match(/\b(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\b/);
	if (dmMatch) {
		const year = dmMatch[3] ? (dmMatch[3].length === 2 ? 2000 + parseInt(dmMatch[3]) : parseInt(dmMatch[3])) : now.getFullYear();
		const d = new Date(year, parseInt(dmMatch[2]) - 1, parseInt(dmMatch[1]));
		if (d < now && !dmMatch[3]) d.setFullYear(d.getFullYear() + 1);
		return d;
	}

	const isoMatch = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
	if (isoMatch) {
		return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
	}

	return null;
}

function parseTime(text: string): [number, number] | null {
	const hhmm = text.match(/\b(\d{1,2})[:.](\d{2})\b/);
	if (hhmm) return [parseInt(hhmm[1]), parseInt(hhmm[2])];
	const uhrMatch = text.match(/(?:@|\bum\s*|^)(\d{1,2})(?::(\d{2}))?\s*(?:uhr|h)\b/i);
	if (uhrMatch) return [parseInt(uhrMatch[1]), uhrMatch[2] ? parseInt(uhrMatch[2]) : 0];
	const ampm = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
	if (ampm) {
		let h = parseInt(ampm[1]);
		if (ampm[3].toLowerCase() === 'pm' && h < 12) h += 12;
		if (ampm[3].toLowerCase() === 'am' && h === 12) h = 0;
		return [h, ampm[2] ? parseInt(ampm[2]) : 0];
	}
	const bareUhr = text.match(/(?:^|\s)(\d{1,2})\s*uhr\b/i);
	if (bareUhr) return [parseInt(bareUhr[1]), 0];
	
	const half = text.match(/\bhalb\s+(eins|zwei|drei|vier|f\u00fcnf|sechs|sieben|acht|neun|zehn|elf|zw\u00f6lf|\d{1,2})\b/i);
	if (half) {
		const map: Record<string, number> = { 'eins': 1, 'zwei': 2, 'drei': 3, 'vier': 4, 'f\u00fcnf': 5, 'sechs': 6, 'sieben': 7, 'acht': 8, 'neun': 9, 'zehn': 10, 'elf': 11, 'zw\u00f6lf': 12 };
		let targetHour = map[half[1].toLowerCase()] || parseInt(half[1]);
		let h = targetHour - 1;
		if (h <= 0) h += 12;
		return [h, 30];
	}

	const viertelNach = text.match(/\bviertel\s+nach\s+(eins|zwei|drei|vier|f\u00fcnf|sechs|sieben|acht|neun|zehn|elf|zw\u00f6lf|\d{1,2})\b/i);
	if (viertelNach) {
		const map: Record<string, number> = { 'eins': 1, 'zwei': 2, 'drei': 3, 'vier': 4, 'f\u00fcnf': 5, 'sechs': 6, 'sieben': 7, 'acht': 8, 'neun': 9, 'zehn': 10, 'elf': 11, 'zw\u00f6lf': 12 };
		let targetHour = map[viertelNach[1].toLowerCase()] || parseInt(viertelNach[1]);
		return [targetHour, 15];
	}
	
	const viertelVor = text.match(/\bviertel\s+vor\s+(eins|zwei|drei|vier|f\u00fcnf|sechs|sieben|acht|neun|zehn|elf|zw\u00f6lf|\d{1,2})\b/i);
	if (viertelVor) {
		const map: Record<string, number> = { 'eins': 1, 'zwei': 2, 'drei': 3, 'vier': 4, 'f\u00fcnf': 5, 'sechs': 6, 'sieben': 7, 'acht': 8, 'neun': 9, 'zehn': 10, 'elf': 11, 'zw\u00f6lf': 12 };
		let targetHour = map[viertelVor[1].toLowerCase()] || parseInt(viertelVor[1]);
		let h = targetHour - 1;
		if (h <= 0) h += 12;
		return [h, 45];
	}

	return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PARSER
// ─────────────────────────────────────────────────────────────────────────────

export function parseNLPInput(text: string): ParsedInput {
	const trimmed = text.trim();
	const lower = trimmed.toLowerCase();

	// ── 0. NOTE ──────────────────────────────────────────────────────────────
	const noteMatch = trimmed.match(/^(?:notiz|notiere|note|aufschreiben|merkzettel)[:\s]+(.+)$/i);
	if (noteMatch) {
		const parts = noteMatch[1].split(/\s+(?:-|—)\s+/);
		const title = parts[0];
		const body = parts.slice(1).join(' - ') || '';
		return { type: 'note', parsed: { title, body } };
	}

	// ── 0. GOAL ──────────────────────────────────────────────────────────────
	const goalMatch = trimmed.match(/^(?:ziel|goal|vorsatz)[:\s]+(.+)$/i);
	if (goalMatch) {
		return { type: 'goal', parsed: { title: goalMatch[1].trim() } };
	}

	// ── 1. MOOD ──────────────────────────────────────────────────────────────
	const MOOD_WORD_MAP: Record<string, number> = {
		'super': 5, 'gro\u00dfartig': 5, 'fantastisch': 5, 'ausgezeichnet': 5, 'perfekt': 5, '\u00fcberragend': 5, 'ph\u00e4nomenal': 5, 'spitze': 5,
		'gl\u00fccklich': 5, 'euphorisch': 5, 'amazing': 5, 'excellent': 5, 'great': 5, 'geil': 5, 'mega': 5,
		'wonderful': 5, 'fantastic': 5, 'awesome': 5, 'genial': 5, 'sehr gut': 5, 'hervorragend': 5,
		'gut drauf': 4, 'gute laune': 4, 'zufrieden': 4, 'happy': 4, 'gut': 4, 'freudig': 4, 'top': 4, 'motiviert': 4,
		'good': 4, 'positive': 4, 'fr\u00f6hlich': 4, 'entspannt': 4, 'relaxed': 4, 'chillig': 4, 'ausgeglichen': 4, 'in ordnung': 4,
		'ok': 3, 'okay': 3, 'mittel': 3, 'so lala': 3, 'normal': 3, 'neutral': 3, 'passt schon': 3, 'geht': 3,
		'meh': 3, 'alright': 3, 'geht so': 3, 'durchschnittlich': 3, 'naja': 3, 'ausreichend': 3,
		'nicht gut': 2, 'm\u00fcde': 2, 'gestresst': 2, 'stressed': 2, 'tired': 2, 'angestrengt': 2, 'angespannt': 2,
		'traurig': 2, 'genervt': 2, 'anxious': 2, '\u00e4ngstlich': 2, 'sad': 2, 'schlecht': 2, 'down': 2, 'frustriert': 2, 'sauer': 2, 'w\u00fctend': 2,
		'sehr schlecht': 1, 'miserabel': 1, 'terrible': 1, 'awful': 1, 'horrible': 1, 'beschissen': 1, 'furchtbar': 1,
		'deprimiert': 1, 'ersch\u00f6pft': 1, 'exhausted': 1, 'ausgelaugt': 1, 'am ende': 1, 'kaputt': 1, 'krank': 1, 'k.o.': 1
	};

	const moodTrigger = /\b(stimmung|mood|gef\u00fchl|feeling|ich\s+f\u00fchl|laune|mir\s+geht\s+es|bin\s+heute)\b/i.test(lower);
	const moodScoreMatch = lower.match(/\b(?:stimmung|mood|gef\u00fchl|feeling|laune)[:\s]*([1-5])\b/i);

	if (moodTrigger) {
		if (moodScoreMatch) return { type: 'mood', parsed: { score: parseInt(moodScoreMatch[1]), note: trimmed } };
		for (const [word, score] of Object.entries(MOOD_WORD_MAP)) {
			if (new RegExp(`\\b${word}\\b`, 'i').test(lower)) return { type: 'mood', parsed: { score, note: trimmed } };
		}
	}

	// ── 2. HEALTH ────────────────────────────────────────────────────────────
	const weightMatch =
		trimmed.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|kilogramm)\b/i) ||
		trimmed.match(/(\d+(?:[.,]\d+)?)\s*(?:lbs?|pounds?)\b/i) ||
		trimmed.match(/\b(?:wiege|gewicht|waage|aktuelles\s*gewicht)[:\s]*(\d+(?:[.,]\d+)?)\b/i);

	const sleepMatch =
		trimmed.match(/(\d+(?:[.,]\d+)?)\s*h(?:r|rs|ours?)?\s*(?:geschlafen|schlaf|sleep|gepennt|ruhe|nickerchen)?\b/i) ||
		trimmed.match(/(\d+(?:[.,]\d+)?)\s*(?:std|stunden?|stunde)\s*(?:geschlafen|schlaf|gepennt|nacht|ruhe)?\b/i) ||
		trimmed.match(/\b(?:geschlafen|schlaf(?:dauer)?|sleep|nachtruhe|gepennt)[:\s]*(\d+(?:[.,]\d+)?)\b/i) ||
		trimmed.match(/\bheute\s+(?:nacht\s+)?(\d+(?:[.,]\d+)?)\s*(?:h|std|stunden?)\b/i);

	const waterMatch =
		trimmed.match(/(\d+(?:[.,]\d+)?)\s*(?:l|liter|ml)\s*(?:wasser|water|getrunken|fl\u00fcssigkeit)?\b/i) ||
		trimmed.match(/(\d+)\s*(?:💧|gl\u00e4ser?|glasses?|glas|flaschen?|tassen?)\b/i) ||
		trimmed.match(/\b(?:wasser|water|getrunken|trinken|hydration|getr\u00e4nk)[:\s]*(\d+(?:[.,]\d+)?)\b/i) ||
		trimmed.match(/\b(\d+)\s*(?:wasser|water|trinken)\b/i);

	const ENERGY_WORD_MAP: Record<string, number> = {
		'sehr hoch': 5, 'voller energie': 5, 'topfit': 5, 'b\u00e4renstark': 5, 'hyperaktiv': 5, 'bestform': 5,
		'hoch': 4, 'energiegeladen': 4, 'fit': 4, 'wach': 4, 'lebhaft': 4, 'stark': 4,
		'mittel': 3, 'ok': 3, 'okay': 3, 'normal': 3, 'ausreichend': 3, 'geht so': 3,
		'niedrig': 2, 'm\u00fcde': 2, 'schlapp': 2, 'schwerf\u00e4llig': 2, 'd\u00e4mmerig': 2, 'schwach': 2,
		'sehr niedrig': 1, 'ersch\u00f6pft': 1, 'k.o.': 1, 'ausgelaugt': 1, 'leer': 1, 'zerst\u00f6rt': 1, 'platt': 1
	};
	const energyMatch = trimmed.match(/\b(?:energie|energy|kraft|power|akku|fitness)[:\s]*([1-5])\b/i);
	let energyWordScore: number | null = null;
	if (/\b(energie|energy|kraft|power|akku|fitness|verfassung)\b/i.test(lower)) {
		for (const [word, score] of Object.entries(ENERGY_WORD_MAP)) {
			if (lower.includes(word)) { energyWordScore = score; break; }
		}
	}

	const stepsMatch =
		trimmed.match(/(\d+(?:[.,]\d+)?)\s*k\s*(?:schritte?|steps?|gegangen|spaziert)\b/i) ||
		trimmed.match(/(\d+)\s*(?:schritte?|steps?|gegangen|spaziert)\b/i) ||
		trimmed.match(/\b(?:schritte?|steps?|pedometer|gegangen)[:\s]*(\d+)/i);
	const stepsRaw = stepsMatch ? parseInt(stepsMatch[1].replace('.', '')) * (stepsMatch[0].toLowerCase().includes('k') ? 1000 : 1) : null;

	const distanceMatch =
		trimmed.match(/(\d+(?:[.,]\d+)?)\s*(?:km|kilometer)\s*(?:gelaufen|lauf|joggen|gejoggt|gefahren|geschwommen|geradelt|gewalkt|spaziert|rad)?/i) ||
		trimmed.match(/\b(?:gelaufen|gejoggt|joggen|gefahren|geschwommen|geradelt|gewalkt|spaziert|rad)[:\s]*(\d+(?:[.,]\d+)?)\s*(?:km|m)?/i) ||
		trimmed.match(/(\d+(?:[.,]\d+)?)\s*(?:miles?|meilen)\b/i) ||
		trimmed.match(/(\d+)\s*(?:m|meter)\s*(?:geschwommen|gelaufen|gejoggt|gegangen)/i);

	const pulseMatch =
		trimmed.match(/\b(?:puls|herzrate|herzfrequenz|pulse|heart\s*rate)[:\s]*(\d+)\b/i) ||
		trimmed.match(/(\d+)\s*bpm\b/i);

	const parseFloat2 = (m: RegExpMatchArray | null) => m ? parseFloat(m[1].replace(',', '.')) : null;

	if (weightMatch || sleepMatch || waterMatch || energyMatch || energyWordScore || stepsMatch || distanceMatch || pulseMatch) {
		let water = waterMatch ? parseFloat2(waterMatch) : null;
		if (waterMatch && waterMatch[0].toLowerCase().includes('l') && !waterMatch[0].toLowerCase().includes('ml')) water = Math.round((water || 0) * 4); // 1L = 4 Glasses
		if (waterMatch && waterMatch[0].toLowerCase().includes('ml')) water = Math.round((water || 0) / 250); // 250ml = 1 Glass

		let distance = distanceMatch ? parseFloat2(distanceMatch) : null;
		if (distanceMatch && distanceMatch[0].toLowerCase().includes('m') && !distanceMatch[0].toLowerCase().includes('km')) distance = (distance || 0) / 1000;

		return {
			type: 'health',
			parsed: {
				weight_kg: parseFloat2(weightMatch),
				sleep_h: parseFloat2(sleepMatch),
				water_glasses: water,
				energy: energyMatch ? parseInt(energyMatch[1], 10) : energyWordScore,
				steps: stepsRaw,
				distance_km: distance,
				pulse_bpm: pulseMatch ? parseInt(pulseMatch[1]) : null
			}
		};
	}

	// ── 3. SHOPPING ──────────────────────────────────────────────────────────
	const NUMBER_WORDS: Record<string, number> = {
		'ein': 1, 'eine': 1, 'einen': 1, 'einem': 1, 'einer': 1,
		'zwei': 2, 'zwo': 2, 'drei': 3, 'vier': 4, 'f\u00fcnf': 5,
		'sechs': 6, 'sieben': 7, 'acht': 8, 'neun': 9, 'zehn': 10,
		'elf': 11, 'zw\u00f6lf': 12, 'zwanzig': 20, 'f\u00fcnfzig': 50,
		'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5
	};

	const SHOP_TRIGGER = /\b(kaufen?|kaufe|besorgen?|besorge|holen?|hole|hol|brauchen?|brauche|brauch|mitbringen|einkaufen|buy|get|pick\s*up|grab|need|bestellen?|bestelle|ordern|shoppen)\b/i;
	
	const hasBuyTrigger = SHOP_TRIGGER.test(lower);

	// Bereinige den Eingabestring von Trigger-Wörtern, um Mengen besser zu isolieren
	let searchString = trimmed;
	if (hasBuyTrigger) {
		searchString = searchString.replace(SHOP_TRIGGER, '').trim();
	}

	// Erlaubt jetzt z.B. "10x Eier" oder "10 Eier" am Anfang des Restsatzes
	const qtyXMatch = searchString.match(/^(\d+(?:[.,]\d+)?)\s*(?:x|st\u00fcck|stk|packungen?|pck|pack|dosen?|flaschen?|liter|l|kg|kilo|g|gramm|bund|kisten?|kartons?|rollen?)?\s+(.+)$/i);
	const qtyNumMatch = searchString.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/i);
	
	let wordQty: { num: number; name: string } | null = null;
	for (const [word, num] of Object.entries(NUMBER_WORDS)) {
		const re = new RegExp(`^${word}\\s+(?:x|st\u00fcck|stk|packungen?|pck|pack|dosen?|flaschen?|liter|l|kg|kilo|g|gramm|bund|kisten?|kartons?|rollen?)?\\s+(.+)$`, 'i');
		const m = searchString.match(re);
		if (m) { wordQty = { num, name: m[1] }; break; }
	}

	if (hasBuyTrigger || qtyXMatch || wordQty) {
		let name = searchString;
		let quantity = 1;

		if (qtyXMatch) {
			quantity = parseFloat(qtyXMatch[1].replace(',', '.'));
			name = qtyXMatch[2];
		} else if (wordQty) {
			quantity = wordQty.num;
			name = wordQty.name;
		} else if (qtyNumMatch) {
			quantity = parseFloat(qtyNumMatch[1].replace(',', '.'));
			name = qtyNumMatch[2];
		}

		name = name.replace(/^x\s+/i, '').replace(/\s+/g, ' ').trim();
		if (!name) name = trimmed;

		return { type: 'shopping', parsed: { name, quantity } };
	}

	// ── 4. CALENDAR EVENT ────────────────────────────────────────────────────
	const EVENT_KEYWORDS = /\b(termin|meeting|call|besprechung|treffen|arzt|zahnarzt|doktor|konferenz|interview|pr\u00e4sentation|deadline|abgabe|kurs|training|workout|gym|yoga|lunch|dinner|fr\u00fchst\u00fcck|appointment|event|reminder|erinnerung|sport|lauf|rennen|wettkampf|date|verabredung|feier|party|geburtstag|hochzeit|urlaub|flug|zug|reise|ausflug|kino)\b/i;

	const dateResult = parseRelativeDate(lower);
	const timeResult = parseTime(trimmed);
	const hasEventKeyword = EVENT_KEYWORDS.test(lower);

	if (dateResult && (timeResult || hasEventKeyword)) {
		const due_at = new Date(dateResult);
		if (timeResult) due_at.setHours(timeResult[0], timeResult[1], 0, 0);

		const isRecurring = /\b(jeden|every|w\u00f6chentlich|weekly|t\u00e4glich|daily|monatlich|j\u00e4hrlich|yearly)\b/i.test(lower);
		const DAY_NAMES = 'montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mo|di|mi|do|fr|sa|so';

		let title = trimmed
			.replace(/(\u00fcber\u00fcbermorgen|\u00fcbermorgen|tomorrow|morgen|heute|today|n\u00e4chste\s*woche|next\s*week|kommende\s*woche|am\s*wochenende|wochenende)/gi, '')
			.replace(/\bin\s*\d+\s*(tag(?:en)?|stunden?|woch(?:en|e)?)\b/gi, '')
			.replace(new RegExp(`\\b(?:am|n\u00e4chsten|n\u00e4chster|kommenden)?\\s*(${DAY_NAMES})\\b`, 'gi'), '')
			.replace(/\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b/g, '')
			.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
			.replace(/@\d{1,2}(?::\d{2})?/g, '')
			.replace(/\b\d{1,2}[:.]\d{2}\b/g, '')
			.replace(/\b\d{1,2}\s*(?:uhr|am|pm|h)\b/gi, '')
			.replace(/\bum\s+\d{1,2}(?:\s*uhr|:\d{2})?\b/gi, '')
			.replace(/\bhalb\s+(eins|zwei|drei|vier|f\u00fcnf|sechs|sieben|acht|neun|zehn|elf|zw\u00f6lf|\d{1,2})\b/gi, '')
			.replace(/\bviertel\s+(?:vor|nach)\s+(eins|zwei|drei|vier|f\u00fcnf|sechs|sieben|acht|neun|zehn|elf|zw\u00f6lf|\d{1,2})\b/gi, '')
			.replace(/\b(jeden|every|w\u00f6chentlich|weekly|t\u00e4glich|daily|monatlich|j\u00e4hrlich)\b/gi, '')
			.replace(/\s+/g, ' ').trim();

		return { type: 'event', parsed: { title: title || trimmed, due_at: due_at.toISOString(), recurring: isRecurring } };
	}

	// ── 5. HABIT LOG ─────────────────────────────────────────────────────────
	const HABIT_PREFIX = /^(?:erledigt|gemacht|done|logged?|geloggt|abgehakt|\u2713|\u2705|habe|hab|abgeschlossen|fertig|check)\s+/i;
	const habitSearch = lower.replace(HABIT_PREFIX, '').trim();

	const matchedHabit = habitsState.habits.find(h => !h.archived && habitSearch.includes(h.name.toLowerCase()));
	if (matchedHabit) {
		return { type: 'habit', parsed: { habitId: matchedHabit.id, name: matchedHabit.name } };
	}

	// ── 6. TASK (FALLBACK) ───────────────────────────────────────────────────
	let priority: 'high' | 'medium' | 'low' = 'medium';
	if (/!(high|hoch|wichtig|dringend|urgent|critical|kritisch|prio 1|asap|schnell)/i.test(trimmed) || /\[+(high|hoch|wichtig|dringend|urgent)\]+/i.test(trimmed) || /^!!/.test(trimmed) || trimmed.includes('‼️')) priority = 'high';
	else if (/!(low|niedrig|sp\u00e4ter|irgendwann|prio 3)/i.test(trimmed)) priority = 'low';

	let taskDue: string | null = null;
	const DUE_PREFIX = /\b(bis|due|f\u00e4llig|deadline|abgabe\s*bis|sp\u00e4testens|zu\s*erledigen\s*bis)\b/i;
	if (DUE_PREFIX.test(lower)) {
		const afterDue = lower.replace(/.*?\b(?:bis|due|f\u00e4llig|deadline|abgabe\s*bis|sp\u00e4testens|zu\s*erledigen\s*bis)\s*/i, '').trim();
		const d = parseRelativeDate(afterDue);
		if (d) taskDue = d.toISOString();
	}

	const contextMatch = trimmed.match(/@([\w\u00e4\u00f6\u00fc\u00df\u00c4\u00d6\u00dc-]+)/);
	const context = contextMatch ? contextMatch[1] : null;

	const projectMatch = trimmed.match(/#([\w\u00e4\u00f6\u00fc\u00df\u00c4\u00d6\u00dc-]+)/);
	const project_name = projectMatch ? projectMatch[1] : null;

	const isRecurringTask = /\b(t\u00e4glich|daily|w\u00f6chentlich|weekly|jeden\s+tag|every\s+day|jeden\s+\w+|jede\s+woche|monatlich)\b/i.test(lower);
	const isReminder = /\b(erinnere\s*mich|remind\s*me|reminder|erinnerung|merken)\b/i.test(lower);

	const cleanTitle = trimmed
		.replace(/!(high|medium|low|hoch|mittel|niedrig|wichtig|dringend|urgent|critical|kritisch|prio 1|asap|schnell|sp\u00e4ter|irgendwann|prio 3)/gi, '')
		.replace(/\[+(high|hoch|wichtig|dringend|urgent)\]+/gi, '')
		.replace(/^!!/, '')
		.replace(/#[\w\u00e4\u00f6\u00fc\u00df\u00c4\u00d6\u00dc-]+/g, '')
		.replace(/@[\w\u00e4\u00f6\u00fc\u00df\u00c4\u00d6\u00dc-]+/g, '')
		.replace(/\b(bis|due|f\u00e4llig|deadline|sp\u00e4testens|zu\s*erledigen\s*bis)\s+\S+/gi, '')
		.replace(/\b(erinnere\s*mich|remind\s*me|reminder|erinnerung|merken)\b/gi, '')
		.replace(/\b(t\u00e4glich|daily|w\u00f6chentlich|weekly|jeden\s+tag|every\s+day|monatlich)\b/gi, '')
		.replace(/\s+/g, ' ').trim();

	return {
		type: 'task',
		parsed: { title: cleanTitle || trimmed, priority, project_name, context, due_at: taskDue, recurring: isRecurringTask, is_reminder: isReminder }
	};
}
