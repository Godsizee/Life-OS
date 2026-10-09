import { describe, expect, it } from 'vitest';
import type { AgendaEintrag } from '#lib/core/modul.js';
import { baueTagesplan } from './agenda.js';
import { istLaufend, waehleJetzt, type Laufend } from './jetzt.js';

const tag = (h: number, min = 0) => new Date(2026, 9, 7, h, min);
const FENSTER = { beginn: tag(8), ende: tag(20) };

let zaehler = 0;
function eintrag(teil: Partial<AgendaEintrag>): AgendaEintrag {
	zaehler += 1;
	return {
		key: `e${zaehler}`,
		modul: 'tasks',
		art: 'aufgabe',
		titel: `Eintrag ${zaehler}`,
		start: null,
		ende: null,
		dauerMin: null,
		erledigt: false,
		href: '/',
		warum: 'Test',
		...teil
	};
}
const termin = (von: Date, bis: Date, teil: Partial<AgendaEintrag> = {}) =>
	eintrag({ modul: 'calendar', art: 'termin', start: von, ende: bis, ...teil });

describe('baueTagesplan — Kapazität', () => {
	it('legt überlappende Termine zusammen (10:00–11:00 und 10:30–12:00 = 120 min)', () => {
		const plan = baueTagesplan(
			[termin(tag(10), tag(11)), termin(tag(10, 30), tag(12))],
			FENSTER,
			30
		);
		expect(plan.kapazitaet.termineMin).toBe(120);
		expect(plan.kapazitaet.verfuegbarMin).toBe(720 - 120);
	});

	it('zählt ganztägige Termine nicht', () => {
		const plan = baueTagesplan([termin(tag(0), tag(23, 59), { ganztags: true })], FENSTER, 30);
		expect(plan.kapazitaet.termineMin).toBe(0);
	});

	it('zählt von einem Termin vor Beginn nur den Anteil im Fenster (07:00–09:00 = 60 min)', () => {
		const plan = baueTagesplan([termin(tag(7), tag(9))], FENSTER, 30);
		expect(plan.kapazitaet.termineMin).toBe(60);
	});

	it('setzt für Aufgaben ohne Schätzung die Standarddauer an', () => {
		const plan = baueTagesplan([eintrag({}), eintrag({})], FENSTER, 30);
		expect(plan.kapazitaet.geplantMin).toBe(60);
	});

	it('ignoriert erledigte Aufgaben bei der geplanten Zeit', () => {
		const plan = baueTagesplan([eintrag({ erledigt: true, dauerMin: 90 })], FENSTER, 30);
		expect(plan.kapazitaet.geplantMin).toBe(0);
	});

	it('erkennt Überbuchung (600 min Aufgaben bei 720 min Fenster und 180 min Terminen)', () => {
		const plan = baueTagesplan(
			[termin(tag(9), tag(12)), eintrag({ dauerMin: 300 }), eintrag({ dauerMin: 300 })],
			FENSTER,
			30
		);
		expect(plan.kapazitaet.verfuegbarMin).toBe(540);
		expect(plan.kapazitaet.geplantMin).toBe(600);
		expect(plan.kapazitaet.ueberbucht).toBe(true);
	});

	it('meldet nicht überbucht, wenn alles hineinpasst', () => {
		const plan = baueTagesplan([eintrag({ dauerMin: 60 })], FENSTER, 30);
		expect(plan.kapazitaet.ueberbucht).toBe(false);
	});

	it('schreibt den Satz im Format von formatMinutes', () => {
		// 200 min = „3 h 20 min“, 240 min = „4 h“. Freie Zeit: 720 − 240 Termine = 480?  Hier: Fenster 8–20, Termin 4 h.
		const plan = baueTagesplan(
			[termin(tag(8), tag(12)), eintrag({ dauerMin: 200 })],
			{ beginn: tag(8), ende: tag(16) },
			30
		);
		expect(plan.kapazitaet.satz).toBe('Geplant 3 h 20 min · frei 4 h');
	});

	it('lässt die freie Zeit nie unter 0 fallen', () => {
		const plan = baueTagesplan([termin(tag(8), tag(20)), termin(tag(7), tag(21))], FENSTER, 30);
		expect(plan.kapazitaet.verfuegbarMin).toBe(0);
	});
});

describe('baueTagesplan — Ordnung', () => {
	it('sortiert zeitliche Einträge aufsteigend und ordnet flexible Aufgabe → Routine → Rest', () => {
		const spaet = termin(tag(15), tag(16));
		const frueh = termin(tag(9), tag(10));
		const routine = eintrag({ art: 'routine', modul: 'habits' });
		const erinnerung = eintrag({ art: 'erinnerung' });
		const aufgabe = eintrag({});
		const plan = baueTagesplan([spaet, routine, erinnerung, frueh, aufgabe], FENSTER, 30);
		expect(plan.zeitlich).toEqual([frueh, spaet]);
		expect(plan.flexibel).toEqual([aufgabe, routine, erinnerung]);
	});

	it('behält die Eingabereihenfolge innerhalb einer Art (Priorität kommt vom Aufrufer)', () => {
		const a = eintrag({ titel: 'A' });
		const b = eintrag({ titel: 'B' });
		const c = eintrag({ titel: 'C' });
		expect(baueTagesplan([b, c, a], FENSTER, 30).flexibel.map((e) => e.titel)).toEqual([
			'B',
			'C',
			'A'
		]);
	});
});

describe('waehleJetzt', () => {
	const ohne: Laufend = null;
	const fokus: Laufend = { art: 'fokus', titel: 'Fokus', href: '/focus', seit: tag(9, 30) };

	it('ein laufender Termin schlägt die flexible Aufgabe', () => {
		const t = termin(tag(10), tag(11));
		const plan = baueTagesplan([eintrag({ titel: 'Wäsche' }), t], FENSTER, 30);
		expect(waehleJetzt(plan, ohne, tag(10, 15))).toBe(t);
	});

	it('eine laufende Fokus-Session schlägt den Termin', () => {
		const plan = baueTagesplan([termin(tag(10), tag(11))], FENSTER, 30);
		const r = waehleJetzt(plan, fokus, tag(10, 15));
		expect(r && istLaufend(r)).toBe(true);
		expect(r).toBe(fokus);
	});

	it('ein Termin in 90 Minuten schlägt die flexible Aufgabe nicht', () => {
		const aufgabe = eintrag({ titel: 'Wäsche' });
		const plan = baueTagesplan([aufgabe, termin(tag(11, 30), tag(12, 30))], FENSTER, 30);
		expect(waehleJetzt(plan, ohne, tag(10))).toBe(aufgabe);
	});

	it('ein Termin in 45 Minuten schlägt die flexible Aufgabe', () => {
		const t = termin(tag(10, 45), tag(11, 30));
		const plan = baueTagesplan([eintrag({}), t], FENSTER, 30);
		expect(waehleJetzt(plan, ohne, tag(10))).toBe(t);
	});

	it('ein Zeitblock einer Aufgabe zählt wie ein Termin (Ende aus der Dauer)', () => {
		const block = eintrag({ start: tag(14), dauerMin: 60 });
		const plan = baueTagesplan([eintrag({}), block], FENSTER, 30);
		expect(waehleJetzt(plan, ohne, tag(14, 20))).toBe(block);
	});

	it('überspringt erledigte Einträge und ganztägige Termine', () => {
		const offen = eintrag({ titel: 'Offen' });
		const plan = baueTagesplan(
			[
				termin(tag(0), tag(23, 59), { ganztags: true }),
				termin(tag(10), tag(11), { erledigt: true }),
				eintrag({ erledigt: true }),
				offen
			],
			FENSTER,
			30
		);
		expect(waehleJetzt(plan, ohne, tag(10, 15))).toBe(offen);
	});

	it('fällt auf die erste offene Routine zurück, dann auf nichts', () => {
		const routine = eintrag({ art: 'routine', modul: 'habits' });
		expect(waehleJetzt(baueTagesplan([routine], FENSTER, 30), ohne, tag(9))).toBe(routine);
		expect(waehleJetzt(baueTagesplan([], FENSTER, 30), ohne, tag(9))).toBeNull();
	});
});
