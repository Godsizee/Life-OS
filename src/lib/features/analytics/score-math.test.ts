import { describe, expect, it } from 'vitest';
import { scoreAverage, scoreSeries } from './score-math';

describe('scoreSeries', () => {
	const heute = new Date(2026, 6, 31); // 31.07.2026

	it('liefert genau `days` Punkte, heute rechts', () => {
		const r = scoreSeries([], 7, heute);
		expect(r).toHaveLength(7);
		expect(r[6].date).toBe('2026-07-31');
		expect(r[0].date).toBe('2026-07-25');
	});

	it('markiert fehlende Tage als null', () => {
		const r = scoreSeries([{ date: '2026-07-31', total: 80 }], 3, heute);
		expect(r.map((p) => p.total)).toEqual([null, null, 80]);
	});
});

describe('scoreAverage', () => {
	it('mittelt nur über erfasste Tage und meldet die Lücke', () => {
		const r = scoreAverage([
			{ date: '2026-07-29', total: null },
			{ date: '2026-07-30', total: 60 },
			{ date: '2026-07-31', total: 80 }
		]);
		expect(r).toEqual({ avg: 70, tracked: 2, total: 3 });
	});

	it('liefert 0 ohne jede Erfassung', () => {
		expect(scoreAverage([{ date: '2026-07-31', total: null }]).avg).toBe(0);
	});
});
