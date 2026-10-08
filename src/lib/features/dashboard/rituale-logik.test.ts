import { describe, expect, it } from 'vitest';
import { ersetzeNachDatum, mitPatch } from './rituale-logik';

const neu = { id: 'a', workspace_id: 'w', user_id: 'u', date: '2026-10-08' };
const T = '2026-10-08T07:00:00.000Z';

describe('mitPatch', () => {
	it('legt einen Eintrag an und normiert Felder', () => {
		const r = mitPatch(
			undefined,
			neu,
			{ planned_at: T, capacity_min: 90.4, intention: '  Fokus  ' },
			T
		);
		expect(r).toMatchObject({
			id: 'a',
			planned_at: T,
			capacity_min: 90,
			intention: 'Fokus',
			closed_at: null
		});
	});

	it('schreibt auf den bestehenden Eintrag fort und lässt andere Felder stehen', () => {
		const a = mitPatch(undefined, neu, { planned_at: T, intention: 'x' }, T);
		const b = mitPatch(
			a,
			{ ...neu, id: 'zweite-id' },
			{ closed_at: '2026-10-08T20:00:00.000Z' },
			T
		);
		expect(b.id).toBe('a');
		expect(b.planned_at).toBe(T);
		expect(b.closed_at).toBe('2026-10-08T20:00:00.000Z');
	});

	it('begrenzt Kapazität auf 0–1440, Intention auf 280 Zeichen; leer wird null', () => {
		expect(mitPatch(undefined, neu, { capacity_min: 5000 }, T).capacity_min).toBe(1440);
		expect(mitPatch(undefined, neu, { capacity_min: -3 }, T).capacity_min).toBe(0);
		expect(mitPatch(undefined, neu, { intention: 'a'.repeat(400) }, T).intention).toHaveLength(280);
		expect(mitPatch(undefined, neu, { intention: '   ' }, T).intention).toBeNull();
	});
});

describe('ersetzeNachDatum', () => {
	it('hält je Datum genau einen Eintrag, neueste zuerst', () => {
		const a = mitPatch(undefined, neu, {}, T);
		const b = mitPatch(undefined, { ...neu, id: 'b', date: '2026-10-07' }, {}, T);
		const a2 = { ...a, id: 'a2' };
		expect(ersetzeNachDatum([b, a], a2).map((r) => r.id)).toEqual(['a2', 'b']);
	});
});
