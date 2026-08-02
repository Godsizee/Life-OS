import { describe, expect, it } from 'vitest';
import { SCORE_WEIGHTS, scoreAverage, scoreSeries, weightLabel, weightedTotal } from './score-math';

describe('SCORE_WEIGHTS', () => {
	it('summiert sich auf genau 1', () => {
		const summe = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
		expect(summe).toBeCloseTo(1, 10);
	});

	it('deckt alle acht Bereiche ab', () => {
		expect(Object.keys(SCORE_WEIGHTS)).toHaveLength(8);
	});
});

describe('weightedTotal', () => {
	it('liefert 100 bei perfektem Tag', () => {
		const alles100 = { tasks: 100, habits: 100, health: 100, fitness: 100, goals: 100, journal: 100, mood: 100, focus: 100 };
		expect(weightedTotal(alles100)).toBe(100);
	});

	it('liefert 0 bei leerem Tag', () => {
		const alles0 = { tasks: 0, habits: 0, health: 0, fitness: 0, goals: 0, journal: 0, mood: 0, focus: 0 };
		expect(weightedTotal(alles0)).toBe(0);
	});

	it('gewichtet Aufgaben stärker als Fokus', () => {
		const nurTasks = { tasks: 100, habits: 0, health: 0, fitness: 0, goals: 0, journal: 0, mood: 0, focus: 0 };
		const nurFocus = { ...nurTasks, tasks: 0, focus: 100 };
		expect(weightedTotal(nurTasks)).toBeGreaterThan(weightedTotal(nurFocus));
	});
});

describe('weightLabel', () => {
	it('entspricht der Gewichtung', () => {
		expect(weightLabel('tasks')).toBe('22 %');
		expect(weightLabel('focus')).toBe('5 %');
	});
});

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
