import { describe, expect, it } from 'vitest';
import {
	formatMetric,
	formatNumber,
	goalHitDays,
	goalPercent,
	metricAverage,
	metricSeries,
	num,
	trackedDays,
	weightToGoal,
	weightTrend,
	windowEntries,
	type HealthLike
} from './stats';

const E = (
	date: string,
	p: Partial<Omit<HealthLike, 'date'>> = {}
): HealthLike => ({
	date,
	weight_kg: p.weight_kg ?? null,
	sleep_h: p.sleep_h ?? null,
	water_glasses: p.water_glasses ?? null,
	energy: p.energy ?? null
});

const TODAY = new Date(2026, 0, 10); // 10.01.2026

describe('num', () => {
	it('castet Postgres-numeric-Strings', () => {
		expect(num('72.50')).toBe(72.5);
	});
	it('gibt null fuer null/leer/Unsinn', () => {
		expect(num(null)).toBeNull();
		expect(num('')).toBeNull();
		expect(num('abc')).toBeNull();
	});
	it('laesst 0 durch', () => {
		expect(num(0)).toBe(0);
	});
});

describe('windowEntries', () => {
	it('nimmt genau die letzten n Tage und sortiert aufsteigend', () => {
		const res = windowEntries(
			[E('2026-01-10'), E('2026-01-03'), E('2026-01-04'), E('2026-01-11')],
			7,
			TODAY
		);
		expect(res.map((e) => e.date)).toEqual(['2026-01-04', '2026-01-10']);
	});
});

describe('metricSeries', () => {
	it('laesst Tage ohne Wert aus und formatiert das Label', () => {
		const res = metricSeries(
			[E('2026-01-08', { sleep_h: 7 }), E('2026-01-09'), E('2026-01-10', { sleep_h: '8.5' })],
			'sleep_h',
			30,
			TODAY
		);
		expect(res).toEqual([
			{ date: '2026-01-08', label: '08.01.', value: 7 },
			{ date: '2026-01-10', label: '10.01.', value: 8.5 }
		]);
	});
	it('gibt eine leere Serie ohne Daten', () => {
		expect(metricSeries([], 'water_glasses', 30, TODAY)).toEqual([]);
	});
});

describe('metricAverage', () => {
	it('mittelt nur erfasste Tage', () => {
		expect(
			metricAverage([E('2026-01-09', { water_glasses: 4 }), E('2026-01-10', { water_glasses: 8 })], 'water_glasses', 7, TODAY)
		).toBe(6);
	});
	it('gibt null ohne Werte', () => {
		expect(metricAverage([E('2026-01-10')], 'sleep_h', 7, TODAY)).toBeNull();
	});
});

describe('goalHitDays', () => {
	it('zaehlt erreichte gegen erfasste Tage', () => {
		const entries = [
			E('2026-01-08', { water_glasses: 8 }),
			E('2026-01-09', { water_glasses: 5 }),
			E('2026-01-10', { water_glasses: 9 }),
			E('2026-01-07')
		];
		expect(goalHitDays(entries, 'water_glasses', 8, 30, TODAY)).toEqual({ hit: 2, tracked: 3 });
	});
	it('zaehlt nichts ohne Ziel', () => {
		expect(goalHitDays([E('2026-01-10', { water_glasses: 8 })], 'water_glasses', 0, 30, TODAY).hit).toBe(0);
	});
});

describe('goalPercent', () => {
	it('rechnet und deckelt bei 100', () => {
		expect(goalPercent(4, 8)).toBe(50);
		expect(goalPercent(12, 8)).toBe(100);
	});
	it('gibt 0 ohne Wert oder Ziel', () => {
		expect(goalPercent(null, 8)).toBe(0);
		expect(goalPercent(4, 0)).toBe(0);
		expect(goalPercent(4, null)).toBe(0);
	});
});

describe('weightTrend', () => {
	it('rechnet erste gegen letzte Messung', () => {
		const res = weightTrend(
			[E('2026-01-01', { weight_kg: 80 }), E('2026-01-10', { weight_kg: '78.8' })],
			30,
			TODAY
		);
		expect(res).toEqual({ first: 80, last: 78.8, delta: -1.2, days: 30 });
	});
	it('gibt null bei weniger als 2 Messungen', () => {
		expect(weightTrend([E('2026-01-10', { weight_kg: 80 })], 30, TODAY)).toBeNull();
	});
});

describe('weightToGoal', () => {
	it('rechnet den Abstand', () => {
		expect(weightToGoal(78.8, 75)).toBe(3.8);
		expect(weightToGoal(74, 75)).toBe(-1);
	});
	it('gibt null ohne Ziel', () => {
		expect(weightToGoal(78, null)).toBeNull();
	});
});

describe('trackedDays', () => {
	it('zaehlt Tage mit Wert', () => {
		expect(
			trackedDays([E('2026-01-09', { energy: 3 }), E('2026-01-10')], 'energy', 30, TODAY)
		).toBe(1);
	});
});

describe('Formatierung', () => {
	it('formatNumber deutsch', () => {
		expect(formatNumber(7.55, 1)).toBe('7,6');
		expect(formatNumber(8, 0)).toBe('8');
	});
	it('formatMetric je Metrik', () => {
		expect(formatMetric('weight_kg', 72.53)).toBe('72,5 kg');
		expect(formatMetric('sleep_h', 7.5)).toBe('7,5 h');
		expect(formatMetric('water_glasses', 1)).toBe('1 Glas');
		expect(formatMetric('water_glasses', 8)).toBe('8 Gläser');
		expect(formatMetric('energy', 4)).toBe('4/5');
		expect(formatMetric('sleep_h', null)).toBe('—');
	});
});
