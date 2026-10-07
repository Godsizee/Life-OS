import { describe, expect, it } from 'vitest';
import type { LifeEvent } from '#lib/core/ereignisse.js';
import type { LifeEventMap, LifeEventType } from '#lib/config/ereignisse.js';
import { planeFuerEreignis, wirksam } from './engine.js';
import type { Regel } from './types.js';

function ereignis<T extends LifeEventType>(
	typ: T,
	daten: LifeEventMap[T],
	ursache: LifeEvent['ursache'] = { art: 'nutzer', tiefe: 0 }
): LifeEvent {
	return { typ, daten, zeit: '2026-10-07T10:00:00', ursache } as LifeEvent;
}

const regel = (patch: Partial<Regel<'aufgabe.erledigt'>> = {}): Regel =>
	({
		id: 'test:regel',
		titel: 'Test',
		erklaerung: 'WENN … DANN …',
		ausloeser: 'aufgabe.erledigt',
		module: ['tasks', 'habits'],
		standard: { aktiv: true, modus: 'auto', parameter: { a: 1, b: 2 } },
		plane: (_e, p) => [{ aktion: 'test.tun', parameter: p }],
		...patch
	}) as Regel;

const erledigt = ereignis('aufgabe.erledigt', {
	id: 't1',
	titel: 'Sport',
	projektId: null,
	zielId: null
});
const alleAktiv = () => true;

describe('planeFuerEreignis', () => {
	it('plant für eine aktive Regel ihre Aktionen', () => {
		const r = regel();
		const res = planeFuerEreignis(erledigt, [r], {}, alleAktiv, true);
		expect(res).toHaveLength(1);
		expect(res[0].regel).toBe(r);
		expect(res[0].modus).toBe('auto');
		expect(res[0].aktionen).toEqual([{ aktion: 'test.tun', parameter: { a: 1, b: 2 } }]);
	});

	it('ignoriert Regeln mit anderem Auslöser', () => {
		const r = regel({ ausloeser: 'training.beendet' as never });
		expect(planeFuerEreignis(erledigt, [r], {}, alleAktiv, true)).toEqual([]);
	});

	it('(a) tut bei einer inaktiven Regel nichts', () => {
		const r = regel({ standard: { aktiv: false, modus: 'auto', parameter: {} } });
		expect(planeFuerEreignis(erledigt, [r], {}, alleAktiv, true)).toEqual([]);
	});

	it('(a) die Überschreibung kann eine Standard-aus-Regel einschalten und umgekehrt', () => {
		const aus = regel({ standard: { aktiv: false, modus: 'auto', parameter: {} } });
		expect(
			planeFuerEreignis(erledigt, [aus], { 'test:regel': { aktiv: true } }, alleAktiv, true)
		).toHaveLength(1);
		expect(
			planeFuerEreignis(erledigt, [regel()], { 'test:regel': { aktiv: false } }, alleAktiv, true)
		).toEqual([]);
	});

	it('(b) ruht, sobald eines der Module aus ist', () => {
		const nurTasks = (id: string) => id === 'tasks';
		expect(planeFuerEreignis(erledigt, [regel()], {}, nurTasks, true)).toEqual([]);
	});

	it('(c) löst sich nicht selbst aus, andere Regeln aber schon', () => {
		const selbst = ereignis(
			'aufgabe.erledigt',
			{ id: 't1', titel: 'x', projektId: null, zielId: null },
			{ art: 'automation', regelId: 'test:regel', tiefe: 1 }
		);
		const andere = regel({ id: 'test:andere' });
		const res = planeFuerEreignis(selbst, [regel(), andere], {}, alleAktiv, true);
		expect(res.map((r) => r.regel.id)).toEqual(['test:andere']);
	});

	it('(d) merged Parameter-Überschreibungen über die Standardwerte', () => {
		const res = planeFuerEreignis(
			erledigt,
			[regel()],
			{ 'test:regel': { parameter: { b: 9, c: 3 } } },
			alleAktiv,
			true
		);
		expect(res[0].aktionen[0].parameter).toEqual({ a: 1, b: 9, c: 3 });
	});

	it('übernimmt den Modus aus der Überschreibung', () => {
		const res = planeFuerEreignis(
			erledigt,
			[regel()],
			{ 'test:regel': { modus: 'fragen' } },
			alleAktiv,
			true
		);
		expect(res[0].modus).toBe('fragen');
	});

	it('(e) liefert bei ausgeschaltetem Hauptschalter nichts', () => {
		expect(planeFuerEreignis(erledigt, [regel()], {}, alleAktiv, false)).toEqual([]);
	});

	it('lässt Regeln weg, die keine Aktion planen', () => {
		const leer = regel({ plane: () => [] });
		expect(planeFuerEreignis(erledigt, [leer], {}, alleAktiv, true)).toEqual([]);
	});
});

describe('wirksam', () => {
	it('fällt ohne Überschreibung auf den Standard zurück', () => {
		expect(wirksam(regel(), undefined)).toEqual({
			aktiv: true,
			modus: 'auto',
			parameter: { a: 1, b: 2 }
		});
	});
});
