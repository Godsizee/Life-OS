import { describe, expect, it } from 'vitest';
import type { LifeEvent } from '#lib/core/ereignisse.js';
import type { LifeEventMap, LifeEventType } from '#lib/config/ereignisse.js';
import {
	REGELN,
	abschlussTagebuch,
	aufgabeRoutineName,
	frequenzZiel,
	rekordZiel,
	tiefLeiserTag,
	trainingCheckin,
	trainingRoutine,
	wasserRoutine
} from './regeln.js';
import { wirksam } from './engine.js';
import type { Regel } from './types.js';

// Lokale Zeit (ohne Z), damit "heute" in jeder Zeitzone 2026-10-07 ist.
function ereignis<T extends LifeEventType>(typ: T, daten: LifeEventMap[T]): LifeEvent<T> {
	return {
		typ,
		daten,
		zeit: '2026-10-07T10:00:00',
		ursache: { art: 'nutzer', tiefe: 0 }
	};
}

/** Wie die Laufzeit: Standard-Parameter der Regel, ggf. überschrieben. */
const plane = <T extends LifeEventType>(
	r: Regel<T>,
	e: LifeEvent<T>,
	parameter: Record<string, unknown> = {}
) => r.plane(e, { ...wirksam(r as Regel, undefined).parameter, ...parameter });

const training = (patch: Partial<LifeEventMap['training.beendet']> = {}) =>
	ereignis('training.beendet', {
		logId: 'l1',
		planId: null,
		datum: '2026-10-07',
		dauerMin: 45,
		neueRekorde: [],
		trainingstageDieseWoche: 2,
		...patch
	});

describe('REGELN', () => {
	it('hat acht Rezepte mit eindeutigen IDs im Namensraum sys:', () => {
		expect(REGELN).toHaveLength(8);
		expect(new Set(REGELN.map((r) => r.id)).size).toBe(8);
		expect(REGELN.every((r) => r.id.startsWith('sys:'))).toBe(true);
	});

	it('erklärt jede Regel als WENN … DANN …', () => {
		for (const r of REGELN) expect(r.erklaerung).toMatch(/^WENN .+ DANN /);
	});

	it('hat Standardwerte laut Zielbild C7.1', () => {
		const std = Object.fromEntries(
			REGELN.map((r) => [r.id, `${r.standard.aktiv}/${r.standard.modus}`])
		);
		expect(std).toEqual({
			'sys:aufgabe-routine-name': 'true/auto',
			'sys:training-routine': 'true/auto',
			'sys:rekord-ziel': 'true/auto',
			'sys:frequenz-ziel': 'true/auto',
			'sys:wasser-routine': 'false/auto',
			'sys:training-checkin': 'true/fragen',
			'sys:tief-leiser-tag': 'true/fragen',
			'sys:abschluss-tagebuch': 'false/fragen'
		});
	});
});

describe('sys:aufgabe-routine-name', () => {
	it('plant das Abhaken nach Namen für den Tag des Ereignisses', () => {
		const e = ereignis('aufgabe.erledigt', {
			id: 't1',
			titel: 'Sport',
			projektId: null,
			zielId: null
		});
		expect(plane(aufgabeRoutineName, e)).toEqual([
			{ aktion: 'habits.abhakenNachName', parameter: { name: 'Sport', datum: '2026-10-07' } }
		]);
	});

	it('plant bei leerem Titel nichts', () => {
		const e = ereignis('aufgabe.erledigt', {
			id: 't1',
			titel: '  ',
			projektId: null,
			zielId: null
		});
		expect(plane(aufgabeRoutineName, e)).toEqual([]);
	});
});

describe('sys:training-routine', () => {
	it('plant ohne habitId nichts', () => {
		expect(plane(trainingRoutine, training())).toEqual([]);
	});

	it('plant mit habitId das Abhaken für den Trainingstag', () => {
		expect(plane(trainingRoutine, training(), { habitId: 'h1' })).toEqual([
			{ aktion: 'habits.abhaken', parameter: { habitId: 'h1', datum: '2026-10-07' } }
		]);
	});
});

describe('sys:rekord-ziel', () => {
	it('plant je Rekord eine Aktion', () => {
		const e = training({
			neueRekorde: [
				{ uebung: 'Bankdrücken', e1rmKg: 100 },
				{ uebung: 'Kniebeuge', e1rmKg: 140 }
			]
		});
		expect(plane(rekordZiel, e)).toEqual([
			{ aktion: 'goals.rekordUebernehmen', parameter: { uebung: 'Bankdrücken', e1rmKg: 100 } },
			{ aktion: 'goals.rekordUebernehmen', parameter: { uebung: 'Kniebeuge', e1rmKg: 140 } }
		]);
	});

	it('plant ohne Rekord nichts', () => {
		expect(plane(rekordZiel, training())).toEqual([]);
	});
});

describe('sys:frequenz-ziel', () => {
	it('gibt die Trainingstage der Woche und das Datum weiter', () => {
		expect(plane(frequenzZiel, training({ trainingstageDieseWoche: 3 }))).toEqual([
			{ aktion: 'goals.frequenzSetzen', parameter: { trainingstage: 3, datum: '2026-10-07' } }
		]);
	});
});

describe('sys:wasser-routine', () => {
	const wasser = (delta: number, datum = '2026-10-07') =>
		ereignis('gesundheit.erfasst', { datum, felder: ['water_ml'], wasserMlDelta: delta });

	it('rechnet 250 ml bei 250 ml je Einheit zu Menge 1', () => {
		expect(plane(wasserRoutine, wasser(250), { habitId: 'h1', mlProEinheit: 250 })).toEqual([
			{ aktion: 'habits.mengeErhoehen', parameter: { habitId: 'h1', menge: 1 } }
		]);
	});

	it('rundet auf ganze Einheiten', () => {
		expect(plane(wasserRoutine, wasser(500), { habitId: 'h1', mlProEinheit: 300 })).toEqual([
			{ aktion: 'habits.mengeErhoehen', parameter: { habitId: 'h1', menge: 2 } }
		]);
	});

	it('plant ohne habitId, bei Delta ≤ 0 und bei Menge 0 nichts', () => {
		expect(plane(wasserRoutine, wasser(250))).toEqual([]);
		expect(plane(wasserRoutine, wasser(-250), { habitId: 'h1' })).toEqual([]);
		expect(plane(wasserRoutine, wasser(100), { habitId: 'h1', mlProEinheit: 250 })).toEqual([]);
	});

	it('plant bei einem nachgetragenen Tag nichts', () => {
		expect(plane(wasserRoutine, wasser(250, '2026-10-05'), { habitId: 'h1' })).toEqual([]);
	});

	it('akzeptiert mlProEinheit als Zahl-Text und lehnt Unsinn ab', () => {
		expect(plane(wasserRoutine, wasser(250), { habitId: 'h1', mlProEinheit: '250' })).toHaveLength(
			1
		);
		expect(plane(wasserRoutine, wasser(250), { habitId: 'h1', mlProEinheit: 0 })).toEqual([]);
		expect(plane(wasserRoutine, wasser(250), { habitId: 'h1', mlProEinheit: 'abc' })).toEqual([]);
	});
});

describe('sys:training-checkin', () => {
	it('bietet den Check-in mit Anlass an', () => {
		expect(plane(trainingCheckin, training())).toEqual([
			{ aktion: 'mood.checkinAnbieten', parameter: { anlass: 'Training beendet' } }
		]);
	});
});

describe('sys:tief-leiser-tag', () => {
	const stimmung = (tiefeTageInFolge: number, datum = '2026-10-07') =>
		ereignis('stimmung.erfasst', { id: 's1', datum, wert: 2, aktivitaeten: [], tiefeTageInFolge });

	it('schlägt ab der Schwelle (Standard 3) einen leisen Tag vor', () => {
		expect(plane(tiefLeiserTag, stimmung(2))).toEqual([]);
		expect(plane(tiefLeiserTag, stimmung(3))).toEqual([
			{ aktion: 'system.leiserTag', parameter: {} }
		]);
		expect(plane(tiefLeiserTag, stimmung(5))).toHaveLength(1);
	});

	it('nimmt die Schwelle aus dem Parameter', () => {
		expect(plane(tiefLeiserTag, stimmung(3), { tage: 5 })).toEqual([]);
		expect(plane(tiefLeiserTag, stimmung(2), { tage: 2 })).toHaveLength(1);
	});

	it('schlägt bei einem nachgetragenen Tag nichts vor', () => {
		expect(plane(tiefLeiserTag, stimmung(4, '2026-10-01'))).toEqual([]);
	});
});

describe('sys:abschluss-tagebuch', () => {
	it('plant den Rückblick nur mit erledigten Aufgaben', () => {
		const mit = ereignis('tag.abgeschlossen', {
			datum: '2026-10-07',
			erledigteAufgaben: ['A', 'B']
		});
		const ohne = ereignis('tag.abgeschlossen', { datum: '2026-10-07', erledigteAufgaben: [] });
		expect(plane(abschlussTagebuch, mit)).toEqual([
			{
				aktion: 'journal.rueckblickAnhaengen',
				parameter: { datum: '2026-10-07', aufgaben: ['A', 'B'] }
			}
		]);
		expect(plane(abschlussTagebuch, ohne)).toEqual([]);
	});
});
