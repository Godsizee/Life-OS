import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Der Parser fragt die geladenen Routinen ab, um „erledigt Sport" als
// Routinen-Eintrag zu erkennen. Hier fest verdrahtet, damit die Tests nicht am
// Supabase-Client haengen.
vi.mock('$lib/features/habits/store.svelte', () => ({
	habitsState: {
		habits: [
			{ id: 'h1', name: 'Sport', archived: false },
			{ id: 'h2', name: 'Meditation', archived: false },
			{ id: 'h3', name: 'Tagebuch', archived: true }
		]
	}
}));

const { parseNLPInput, parseRelativeDate } = await import('./nlp-parse');

/** Mittwoch, 12:00 Uhr Ortszeit — feste Basis für alle relativen Angaben. */
const JETZT = new Date(2026, 5, 10, 12, 0, 0);

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(JETZT);
});

afterEach(() => {
	vi.useRealTimers();
});

/** Kalendertage zwischen zwei Daten, unabhängig von der Uhrzeit. */
function tageDifferenz(d: Date): number {
	const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	const b = new Date(JETZT.getFullYear(), JETZT.getMonth(), JETZT.getDate());
	return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

describe('parseRelativeDate — relative Angaben', () => {
	it.each([
		['heute', 0],
		['today', 0],
		['morgen', 1],
		['tomorrow', 1],
		['übermorgen', 2],
		['überübermorgen', 3],
		['in 3 tagen', 3],
		['in 5 tagen', 5],
		['in 1 tag', 1],
		['in 2 wochen', 14]
	])('%s -> %i Tage', (eingabe, tage) => {
		const d = parseRelativeDate(eingabe);
		expect(d).not.toBeNull();
		expect(tageDifferenz(d!)).toBe(tage);
	});

	it('rechnet Stundenangaben auf die Uhrzeit, nicht auf den Tag', () => {
		const d = parseRelativeDate('in 3 stunden');
		expect(d!.getHours()).toBe(15);
		expect(tageDifferenz(d!)).toBe(0);
	});

	it('reicht über Monatsgrenzen hinweg', () => {
		vi.setSystemTime(new Date(2026, 5, 30, 12, 0, 0)); // 30. Juni
		const d = parseRelativeDate('in 3 tagen');
		expect(d!.getMonth()).toBe(6); // Juli
		expect(d!.getDate()).toBe(3);
	});

	it('reicht über Jahresgrenzen hinweg', () => {
		vi.setSystemTime(new Date(2026, 11, 30, 12, 0, 0)); // 30. Dezember
		const d = parseRelativeDate('übermorgen');
		expect(d!.getFullYear()).toBe(2027);
		expect(d!.getMonth()).toBe(0);
		expect(d!.getDate()).toBe(1);
	});
});

describe('parseRelativeDate — Wochentage', () => {
	it('trifft den genannten Wochentag', () => {
		const d = parseRelativeDate('freitag');
		expect(d!.getDay()).toBe(5);
	});

	it('meint bei heutigem Wochentag die NÄCHSTE Woche, nicht heute', () => {
		// Basis ist ein Mittwoch. „mittwoch" darf nicht auf heute zeigen, sonst
		// waere ein Termin sofort in der Vergangenheit.
		const d = parseRelativeDate('mittwoch');
		expect(d!.getDay()).toBe(3);
		expect(tageDifferenz(d!)).toBe(7);
	});

	it('versteht „nächste Woche" als kommenden Montag', () => {
		const d = parseRelativeDate('nächste woche');
		expect(d!.getDay()).toBe(1);
		expect(tageDifferenz(d!)).toBeGreaterThan(0);
	});

	it('versteht „am Wochenende" als kommenden Samstag', () => {
		const d = parseRelativeDate('am wochenende');
		expect(d!.getDay()).toBe(6);
	});
});

describe('parseRelativeDate — feste Daten', () => {
	it('liest Tag.Monat', () => {
		const d = parseRelativeDate('24.12.');
		expect(d!.getDate()).toBe(24);
		expect(d!.getMonth()).toBe(11);
	});

	it('schiebt ein bereits vergangenes Datum ohne Jahr ins Folgejahr', () => {
		const d = parseRelativeDate('5.1.'); // 5. Januar liegt vor dem 10. Juni
		expect(d!.getFullYear()).toBe(2027);
	});

	it('nimmt ein ausdrückliches Jahr, auch wenn es in der Vergangenheit liegt', () => {
		const d = parseRelativeDate('01.02.2020');
		expect(d!.getFullYear()).toBe(2020);
		expect(d!.getMonth()).toBe(1);
	});

	it('liest zweistellige Jahre als 20xx', () => {
		const d = parseRelativeDate('01.02.28');
		expect(d!.getFullYear()).toBe(2028);
	});

	it('liest ISO-Daten', () => {
		const d = parseRelativeDate('2027-03-15');
		expect(d!.getFullYear()).toBe(2027);
		expect(d!.getMonth()).toBe(2);
		expect(d!.getDate()).toBe(15);
	});

	it('liefert null, wenn nichts Datumsartiges drinsteht', () => {
		expect(parseRelativeDate('einkaufen gehen')).toBeNull();
		expect(parseRelativeDate('')).toBeNull();
	});
});

describe('parseNLPInput — Notiz und Ziel', () => {
	it('erkennt eine Notiz und trennt Titel von Rumpf', () => {
		const r = parseNLPInput('Notiz: Einkaufsidee - Rezept für Lasagne');
		expect(r.type).toBe('note');
		expect(r.parsed.title).toBe('Einkaufsidee');
		expect(r.parsed.body).toBe('Rezept für Lasagne');
	});

	it('erkennt eine Notiz ohne Rumpf', () => {
		const r = parseNLPInput('notiere Passwort ändern');
		expect(r.type).toBe('note');
		expect(r.parsed.title).toBe('Passwort ändern');
		expect(r.parsed.body).toBe('');
	});

	it('erkennt ein Ziel', () => {
		const r = parseNLPInput('Ziel: 10 Bücher lesen');
		expect(r.type).toBe('goal');
		expect(r.parsed.title).toBe('10 Bücher lesen');
	});
});

describe('parseNLPInput — Stimmung', () => {
	it('liest eine Ziffer', () => {
		const r = parseNLPInput('Stimmung 4');
		expect(r.type).toBe('mood');
		expect(r.parsed.score).toBe(4);
	});

	it('liest ein Stimmungswort', () => {
		const r = parseNLPInput('Meine Laune ist heute super');
		expect(r.type).toBe('mood');
		expect(r.parsed.score).toBe(5);
	});

	it('sammelt Hashtags als Aktivitäten', () => {
		const r = parseNLPInput('Stimmung 5 #sport #freunde');
		expect(r.type).toBe('mood');
		expect(r.parsed.activities).toEqual(['sport', 'freunde']);
	});

	it('greift ohne Auslöserwort NICHT — „gut" allein ist keine Stimmungsangabe', () => {
		expect(parseNLPInput('Buch gut zurückgeben').type).not.toBe('mood');
	});
});

describe('parseNLPInput — Gesundheit', () => {
	it('liest Gewicht mit Komma', () => {
		const r = parseNLPInput('78,5 kg');
		expect(r.type).toBe('health');
		expect(r.parsed.weight_kg).toBe(78.5);
	});

	it('liest Schlafdauer', () => {
		const r = parseNLPInput('7,5 stunden geschlafen');
		expect(r.type).toBe('health');
		expect(r.parsed.sleep_h).toBe(7.5);
	});

	it('rechnet Liter in Milliliter um', () => {
		const r = parseNLPInput('2 l wasser getrunken');
		expect(r.type).toBe('health');
		expect(r.parsed.water_ml).toBe(2000);
	});

	it('rechnet Gläser mit 250 ml', () => {
		const r = parseNLPInput('3 gläser wasser');
		expect(r.type).toBe('health');
		expect(r.parsed.water_ml).toBe(750);
	});

	it('nimmt Milliliter unverändert', () => {
		const r = parseNLPInput('500 ml wasser');
		expect(r.parsed.water_ml).toBe(500);
	});

	it('liest Schritte, auch in Tausenderschreibweise', () => {
		expect(parseNLPInput('8500 schritte').parsed.steps).toBe(8500);
		expect(parseNLPInput('8k schritte').parsed.steps).toBe(8000);
	});

	it('liest den Puls', () => {
		expect(parseNLPInput('puls 62').parsed.pulse_bpm).toBe(62);
		expect(parseNLPInput('62 bpm').parsed.pulse_bpm).toBe(62);
	});

	it('lässt nicht genannte Werte auf null', () => {
		const r = parseNLPInput('80 kg');
		expect(r.parsed.sleep_h).toBeNull();
		expect(r.parsed.water_ml).toBeNull();
		expect(r.parsed.steps).toBeNull();
	});
});

describe('parseNLPInput — Einkauf', () => {
	it('erkennt ein Auslöserwort', () => {
		const r = parseNLPInput('Milch kaufen');
		expect(r.type).toBe('shopping');
		expect(r.parsed.name).toBe('Milch');
		expect(r.parsed.quantity).toBe(1);
	});

	it('liest eine Menge mit x', () => {
		const r = parseNLPInput('kaufen 2x Eier');
		expect(r.type).toBe('shopping');
		expect(r.parsed.quantity).toBe(2);
		expect(r.parsed.name).toBe('Eier');
	});

	it('liest ausgeschriebene Mengen', () => {
		const r = parseNLPInput('besorge zwei Packungen Butter');
		expect(r.type).toBe('shopping');
		expect(r.parsed.quantity).toBe(2);
		expect(r.parsed.name).toBe('Butter');
	});

	it('setzt ohne Mengenangabe 1', () => {
		expect(parseNLPInput('brauche Klopapier').parsed.quantity).toBe(1);
	});
});

describe('parseNLPInput — Termine', () => {
	it('erkennt Datum plus Uhrzeit', () => {
		const r = parseNLPInput('Meeting morgen 14:00');
		expect(r.type).toBe('event');
		const d = new Date(r.parsed.due_at);
		expect(tageDifferenz(d)).toBe(1);
		expect(d.getHours()).toBe(14);
		expect(d.getMinutes()).toBe(0);
	});

	it('räumt Datum und Uhrzeit aus dem Titel', () => {
		const r = parseNLPInput('Zahnarzt am Freitag um 9 uhr');
		expect(r.type).toBe('event');
		expect(r.parsed.title).toBe('Zahnarzt');
	});

	it('versteht „halb zehn"', () => {
		const r = parseNLPInput('Termin morgen halb zehn');
		const d = new Date(r.parsed.due_at);
		expect(d.getHours()).toBe(9);
		expect(d.getMinutes()).toBe(30);
	});

	it('versteht „viertel vor acht"', () => {
		const r = parseNLPInput('Termin morgen viertel vor acht');
		const d = new Date(r.parsed.due_at);
		expect(d.getHours()).toBe(7);
		expect(d.getMinutes()).toBe(45);
	});

	it('markiert Wiederholungen', () => {
		expect(parseNLPInput('Training jeden Montag 18:00').parsed.recurring).toBe(true);
		expect(parseNLPInput('Meeting morgen 14:00').parsed.recurring).toBe(false);
	});

	it('braucht ohne Uhrzeit ein Terminwort', () => {
		// „morgen" allein macht aus einer Aufgabe keinen Kalendertermin.
		expect(parseNLPInput('Wäsche morgen').type).toBe('task');
		expect(parseNLPInput('Arzt morgen').type).toBe('event');
	});
});

describe('parseNLPInput — Routinen', () => {
	it('erkennt eine geladene Routine', () => {
		const r = parseNLPInput('erledigt Sport');
		expect(r.type).toBe('habit');
		expect(r.parsed.habitId).toBe('h1');
	});

	it('erkennt sie auch ohne Präfix', () => {
		expect(parseNLPInput('Meditation').type).toBe('habit');
	});

	it('ignoriert archivierte Routinen', () => {
		// Sonst liesse sich in eine Routine einbuchen, die es nicht mehr gibt.
		expect(parseNLPInput('Tagebuch').type).not.toBe('habit');
	});
});

describe('parseNLPInput — Aufgabe als Rückfall', () => {
	it('wird zur Aufgabe, wenn nichts anderes greift', () => {
		const r = parseNLPInput('Steuererklärung fertig machen');
		expect(r.type).toBe('task');
		expect(r.parsed.title).toBe('Steuererklärung fertig machen');
		expect(r.parsed.priority).toBe('medium');
	});

	it('liest Prioritäten', () => {
		expect(parseNLPInput('Rechnung zahlen !dringend').parsed.priority).toBe('high');
		expect(parseNLPInput('!!Rechnung zahlen').parsed.priority).toBe('high');
		expect(parseNLPInput('Keller aufräumen !später').parsed.priority).toBe('low');
	});

	it('trennt Projekt und Kontext ab und räumt sie aus dem Titel', () => {
		const r = parseNLPInput('Angebot schreiben #arbeit @büro');
		expect(r.parsed.project_name).toBe('arbeit');
		expect(r.parsed.context).toBe('büro');
		expect(r.parsed.title).toBe('Angebot schreiben');
	});

	it('liest eine Fälligkeit hinter „bis"', () => {
		const r = parseNLPInput('Bericht schreiben bis freitag');
		expect(r.type).toBe('task');
		expect(new Date(r.parsed.due_at).getDay()).toBe(5);
	});

	it('markiert Wiederholung und Erinnerung', () => {
		expect(parseNLPInput('Müll rausbringen wöchentlich').parsed.recurring).toBe(true);
		expect(parseNLPInput('Erinnere mich an die Rechnung').parsed.is_reminder).toBe(true);
	});

	it('behält den Originaltext, wenn das Bereinigen alles wegräumt', () => {
		// Sonst entstuende eine Aufgabe ohne Titel.
		const r = parseNLPInput('#projekt');
		expect(r.parsed.title).toBe('#projekt');
	});
});
