import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseTaskInput } from './quick-add';

/** Mittwoch, 10.06.2026, 12:00 Uhr Ortszeit. */
const JETZT = new Date(2026, 5, 10, 12, 0, 0);

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(JETZT);
});
afterEach(() => vi.useRealTimers());

const lokal = (iso: string | null) => {
	const d = new Date(iso!);
	return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
};

describe('parseTaskInput', () => {
	it('erkennt hohe Priorität und säubert den Titel', () => {
		const r = parseTaskInput('Steuer machen !hoch');
		expect(r.priority).toBe('high');
		expect(r.title).toBe('Steuer machen');
	});
	it('kennt p1 und p3 als Priorität', () => {
		expect(parseTaskInput('Steuer p1').priority).toBe('high');
		expect(parseTaskInput('Steuer p1').title).toBe('Steuer');
		expect(parseTaskInput('Keller p3').priority).toBe('low');
	});
	it('extrahiert Projekt (#) und mehrere Labels (@)', () => {
		const r = parseTaskInput('Angebot schreiben #Finanzen @wichtig @schnell');
		expect(r.project_name).toBe('Finanzen');
		expect(r.labels).toEqual(['wichtig', 'schnell']);
		expect(r.title).toBe('Angebot schreiben');
	});
	it('erkennt Wiederholung', () => {
		expect(parseTaskInput('Blumen gießen täglich').rrule).toBe('FREQ=DAILY');
		expect(parseTaskInput('Bad putzen wöchentlich').rrule).toBe('FREQ=WEEKLY');
	});
	it('leerer Rest-Titel fällt auf Originaltext zurück', () => {
		expect(parseTaskInput('#nur @label').title.length).toBeGreaterThan(0);
	});
});

describe('Geplant (Absicht) statt Frist', () => {
	it('ein Tageswort setzt planned_for, nicht due_at', () => {
		const r = parseTaskInput('Müll rausbringen morgen');
		expect(r.planned_for).toBe('2026-06-11');
		expect(r.due_at).toBeNull();
		expect(r.title).toBe('Müll rausbringen');
	});
	it.each([
		['Wäsche heute', '2026-06-10'],
		['Wäsche übermorgen', '2026-06-12'],
		['Wäsche Freitag', '2026-06-12'],
		['Wäsche am Montag', '2026-06-15'],
		['Wäsche 13.6.', '2026-06-13']
	])('%s -> planned_for %s', (eingabe, tag) => {
		expect(parseTaskInput(eingabe).planned_for).toBe(tag);
	});
	it('verwechselt keine Wörter, die mit einem Tageswort beginnen', () => {
		const r = parseTaskInput('Morgenroutine überarbeiten');
		expect(r.planned_for).toBeNull();
		expect(r.title).toBe('Morgenroutine überarbeiten');
	});
	it('lässt kurze Wochentage („so“, „do“) im Titel', () => {
		const r = parseTaskInput('das so machen');
		expect(r.planned_for).toBeNull();
		expect(r.title).toBe('das so machen');
	});
});

describe('Frist (Muss)', () => {
	it('„bis Freitag“ setzt das Tagesende lokal', () => {
		const r = parseTaskInput('Bericht schreiben bis Freitag');
		expect(lokal(r.due_at)).toEqual([2026, 6, 12, 23, 59]);
		expect(r.planned_for).toBeNull();
		expect(r.title).toBe('Bericht schreiben');
	});
	it('„fällig morgen 14:00“ nimmt die Uhrzeit', () => {
		const r = parseTaskInput('Antrag fällig morgen 14:00');
		expect(lokal(r.due_at)).toEqual([2026, 6, 11, 14, 0]);
		expect(r.title).toBe('Antrag');
	});
	it('Frist und Plantag lassen sich kombinieren', () => {
		const r = parseTaskInput('Steuer machen morgen bis Freitag');
		expect(r.planned_for).toBe('2026-06-11');
		expect(lokal(r.due_at)).toEqual([2026, 6, 12, 23, 59]);
		expect(r.title).toBe('Steuer machen');
	});
	it('„bis“ ohne Datum bleibt im Titel', () => {
		const r = parseTaskInput('von 9 bis 5 arbeiten');
		expect(r.due_at).toBeNull();
		expect(r.title).toBe('von 9 bis 5 arbeiten');
	});
});

describe('Dauer und Zeitblock', () => {
	it.each([
		['Steuer 30min', 30],
		['Steuer 2h', 120],
		['Steuer 1,5h', 90],
		['Steuer 1h30min', 90]
	])('%s -> %i min', (eingabe, min) => {
		const r = parseTaskInput(eingabe);
		expect(r.estimate_min).toBe(min);
		expect(r.title).toBe('Steuer');
	});
	it('ignoriert unsinnige Dauer', () => {
		expect(parseTaskInput('Steuer 2000min').estimate_min).toBeNull();
	});
	it('„um 10:00“ wird mit Plantag zum Zeitblock', () => {
		const r = parseTaskInput('Steuer morgen um 10:00');
		expect(r.planned_for).toBe('2026-06-11');
		expect(lokal(r.scheduled_start)).toEqual([2026, 6, 11, 10, 0]);
		expect(r.title).toBe('Steuer');
	});
	it('ohne Plantag gibt es keinen Zeitblock', () => {
		const r = parseTaskInput('Steuer um 10:00');
		expect(r.scheduled_start).toBeNull();
	});
	it('kombinierte Eingabe', () => {
		const r = parseTaskInput('Steuer machen morgen 30min bis Freitag !hoch #Finanzen @wichtig');
		expect(r).toMatchObject({
			title: 'Steuer machen',
			priority: 'high',
			project_name: 'Finanzen',
			labels: ['wichtig'],
			planned_for: '2026-06-11',
			estimate_min: 30
		});
		expect(lokal(r.due_at)).toEqual([2026, 6, 12, 23, 59]);
	});
});

describe('Wiederholung', () => {
	it('übernimmt den Plantag als Frist, damit die Serie weiterläuft', () => {
		const r = parseTaskInput('Blumen gießen täglich morgen');
		expect(r.rrule).toBe('FREQ=DAILY');
		expect(r.planned_for).toBe('2026-06-11');
		expect(lokal(r.due_at)).toEqual([2026, 6, 11, 23, 59]);
	});
});
