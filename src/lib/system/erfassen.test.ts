import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Die Arten importieren ihre Stores nur für ausfuehren(); für die Erkennung sind sie unnötig.
vi.mock('#lib/features/tasks/store.svelte.js', () => ({ tasksState: {} }));
vi.mock('#lib/features/shopping/store.svelte.js', () => ({ shoppingState: {} }));
vi.mock('#lib/features/calendar/store.svelte.js', () => ({ calendarState: {} }));
vi.mock('#lib/features/health/store.svelte.js', () => ({ healthState: {} }));
vi.mock('#lib/features/habits/store.svelte.js', () => ({ habitsState: {} }));
vi.mock('#lib/features/mood/store.svelte.js', () => ({ moodState: {} }));
vi.mock('#lib/features/notes/store.svelte.js', () => ({ notesState: {} }));
vi.mock('#lib/features/goals/store.svelte.js', () => ({ goalsState: {} }));

import { parseNLPInput, setzeRoutinenQuelle } from '#lib/core/nlp-parse.js';
import { terminErfassen } from '#lib/features/calendar/erfassen.js';
import { zielErfassen } from '#lib/features/goals/erfassen.js';
import { gesundheitErfassen } from '#lib/features/health/erfassen.js';
import { routineErfassen } from '#lib/features/habits/erfassen.js';
import { stimmungErfassen } from '#lib/features/mood/erfassen.js';
import { notizErfassen } from '#lib/features/notes/erfassen.js';
import { einkaufErfassen } from '#lib/features/shopping/erfassen.js';
import { aufgabeErfassen } from '#lib/features/tasks/erfassen.js';
import { alternativenIn, beispieleIn, deuteIn, SICHERHEIT_MIN } from './erfassen-kern';

const MODULE = [
	{ id: 'tasks' as const, erfassen: [aufgabeErfassen] },
	{ id: 'shopping' as const, erfassen: [einkaufErfassen] },
	{ id: 'calendar' as const, erfassen: [terminErfassen] },
	{ id: 'health' as const, erfassen: [gesundheitErfassen] },
	{ id: 'habits' as const, erfassen: [routineErfassen] },
	{ id: 'mood' as const, erfassen: [stimmungErfassen] },
	{ id: 'notes' as const, erfassen: [notizErfassen] },
	{ id: 'goals' as const, erfassen: [zielErfassen] }
];

setzeRoutinenQuelle(() => [
	{ id: 'h1', name: 'Sport', archived: false },
	{ id: 'h2', name: 'Meditation', archived: false },
	{ id: 'h3', name: 'Tagebuch', archived: true }
]);

/** Mittwoch, 10.06.2026, 12:00 Uhr Ortszeit. */
const JETZT = new Date(2026, 5, 10, 12, 0, 0);
beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(JETZT);
});
afterEach(() => vi.useRealTimers());

const ART_ZU_TYP = {
	task: 'aufgabe',
	shopping: 'einkauf',
	event: 'termin',
	health: 'gesundheit',
	habit: 'routine',
	note: 'notiz',
	goal: 'ziel',
	mood: 'stimmung'
} as const;

/** Eingaben aus core/nlp-parse.test.ts, die eine Art liefern. */
const EINGABEN = [
	'Notiz: Einkaufsidee - Rezept für Lasagne',
	'notiere Passwort ändern',
	'Ziel: 10 Bücher lesen',
	'Stimmung 4',
	'Meine Laune ist heute super',
	'Stimmung 5 #sport #freunde',
	'Buch gut zurückgeben',
	'78,5 kg',
	'7,5 stunden geschlafen',
	'2 l wasser getrunken',
	'3 gläser wasser',
	'500 ml wasser',
	'8500 schritte',
	'8k schritte',
	'puls 62',
	'62 bpm',
	'80 kg',
	'Milch kaufen',
	'kaufen 2x Eier',
	'besorge zwei Packungen Butter',
	'brauche Klopapier',
	'Meeting morgen 14:00',
	'Zahnarzt am Freitag um 9 uhr',
	'Termin morgen halb zehn',
	'Termin morgen viertel vor acht',
	'Training jeden Montag 18:00',
	'Wäsche morgen',
	'Arzt morgen',
	'erledigt Sport',
	'Meditation',
	'Tagebuch',
	'Steuererklärung fertig machen',
	'Rechnung zahlen !dringend',
	'!!Rechnung zahlen',
	'Keller aufräumen !später',
	'Angebot schreiben #arbeit @büro',
	'Bericht schreiben bis freitag',
	'Müll rausbringen wöchentlich',
	'Erinnere mich an die Rechnung',
	'#projekt'
];

describe('deute — Gleichwertigkeit zur früheren Einzel-Auswertung', () => {
	it.each(EINGABEN)('%s', (text) => {
		const erwartet = ART_ZU_TYP[parseNLPInput(text).type];
		expect(deuteIn(MODULE, text, JETZT)[0].art.id).toBe(erwartet);
	});
});

describe('deute — Vorschau', () => {
	it('Termin zeigt Wann und Dauer', () => {
		const d = deuteIn(MODULE, 'Zahnarzt morgen 10:00', JETZT)[0];
		expect(d.art.id).toBe('termin');
		expect(d.vorschau.felder).toContainEqual({ label: 'Wann', wert: 'Do 11.06. · 10:00' });
		expect(d.vorschau.felder).toContainEqual({ label: 'Dauer', wert: '1 h' });
	});

	it('Aufgabe mit Zusätzen ist sicher, reiner Text nur der Rückfall', () => {
		const mit = deuteIn(MODULE, 'Steuer machen morgen 30min bis Freitag', JETZT)[0];
		expect(mit.art.id).toBe('aufgabe');
		expect(mit.vorschau.sicherheit).toBeGreaterThanOrEqual(SICHERHEIT_MIN);
		expect(mit.vorschau.felder.map((f) => f.label)).toEqual(['Titel', 'Geplant', 'Frist', 'Dauer']);

		const ohne = deuteIn(MODULE, 'Steuer machen', JETZT)[0];
		expect(ohne.art.id).toBe('aufgabe');
		expect(ohne.vorschau.sicherheit).toBeLessThan(SICHERHEIT_MIN);
	});

	it('ein langer Text wird zur Notiz, verdrängt aber keine Gesundheitsangabe', () => {
		const lang = 'Ich denke seit Tagen darüber nach, wie wir den Urlaub planen könnten. '.repeat(3);
		expect(deuteIn(MODULE, lang, JETZT)[0].art.id).toBe('notiz');
		expect(deuteIn(MODULE, `${lang} 75 kg`, JETZT)[0].art.id).toBe('gesundheit');
	});

	it('leerer Text liefert nichts', () => {
		expect(deuteIn(MODULE, '   ', JETZT)).toEqual([]);
	});

	it('abgeschaltete Module liefern nichts und Aufgabe bleibt der Rückfall', () => {
		const ohneEinkauf = MODULE.filter((m) => m.id !== 'shopping');
		expect(deuteIn(ohneEinkauf, 'Milch kaufen', JETZT)[0].art.id).toBe('aufgabe');
		expect(deuteIn([], 'Milch kaufen', JETZT)).toEqual([]);
	});

	it('eine werfende Erkennung verdeckt die übrigen nicht', () => {
		const kaputt = {
			id: 'notes' as const,
			erfassen: [
				{
					...notizErfassen,
					erkennen: () => {
						throw new Error('kaputt');
					}
				}
			]
		};
		vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(deuteIn([kaputt, MODULE[0]], 'Milch', JETZT)[0].art.id).toBe('aufgabe');
	});
});

describe('alternativen / beispiele', () => {
	it('bietet für „Milch“ Einkauf, Notiz und Ziel zum Umschalten an', () => {
		const d = deuteIn(MODULE, 'Milch', JETZT);
		const ids = alternativenIn(MODULE, 'Milch', d).map((a) => a.art.id);
		expect(ids).toEqual(expect.arrayContaining(['einkauf', 'notiz', 'ziel']));
		expect(ids).not.toContain('aufgabe'); // bereits die gewählte Deutung
	});

	it('listet die Beispiele aller aktiven Arten', () => {
		const ids = beispieleIn(MODULE).map((b) => b.id);
		expect(ids).toHaveLength(8);
		expect(beispieleIn(MODULE).every((b) => b.beispiele.length > 0)).toBe(true);
	});
});
