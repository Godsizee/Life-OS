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
	waterMl,
	movingAverage,
	weightGoalPercent,
	sleepEnergyBuckets,
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
	water_ml: p.water_ml ?? null,
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

describe('waterMl', () => {
	it('bevorzugt water_ml', () => {
		expect(waterMl(E('2026-07-31', { water_ml: 1750, water_glasses: 8 }))).toBe(1750);
	});

	it('rechnet Altzeilen mit 250 ml je Glas hoch', () => {
		expect(waterMl(E('2026-01-01', { water_ml: null, water_glasses: 6 }))).toBe(1500);
	});

	it('liefert null, wenn beide Felder leer sind', () => {
		expect(waterMl(E('2026-01-01', { water_ml: null, water_glasses: null }))).toBeNull();
	});

	it('unterscheidet 0 ml von "nicht erfasst"', () => {
		expect(waterMl(E('2026-01-01', { water_ml: 0, water_glasses: null }))).toBe(0);
	});
});

describe('movingAverage', () => {
	it('glättet und behält die Punktanzahl', () => {
		const p = [1, 3, 2, 4].map((v, i) => ({ date: `2026-07-0${i + 1}`, label: '', value: v }));
		const g = movingAverage(p, 2);
		expect(g).toHaveLength(4);
		expect(g[1].value).toBe(2);   // (1+3)/2
		expect(g[3].value).toBe(3);   // (2+4)/2
	});
});

describe('weightGoalPercent', () => {
	it('misst den Weg von Start zu Ziel', () => {
		expect(weightGoalPercent(80, 75, 70)).toBe(50);
		expect(weightGoalPercent(80, 80, 70)).toBe(0);
		expect(weightGoalPercent(80, 70, 70)).toBe(100);
	});

	it('funktioniert auch beim Zunehmen', () => {
		expect(weightGoalPercent(60, 65, 70)).toBe(50);
	});

	it('liefert null ohne Ziel', () => {
		expect(weightGoalPercent(80, 75, null)).toBeNull();
	});
});

describe('sleepEnergyBuckets', () => {
	it('gruppiert nach Schlafklasse und lässt leere Klassen weg', () => {
		const entries = [
			E('2026-01-01', { sleep_h: 5.5, energy: 2 }),
			E('2026-01-02', { sleep_h: 6.5, energy: 3 }),
			E('2026-01-03', { sleep_h: 6.5, energy: 4 })
		];
		const buckets = sleepEnergyBuckets(entries, 30, TODAY);
		expect(buckets).toHaveLength(2);
		expect(buckets[0].label).toBe('unter 6 h');
		expect(buckets[0].avgEnergy).toBe(2);
		expect(buckets[1].label).toBe('6–7 h');
		expect(buckets[1].avgEnergy).toBe(3.5);
	});
	it('ignoriert Tage, an denen eine der beiden Metriken fehlt', () => {
		const entries = [
			E('2026-01-01', { sleep_h: 7.5, energy: null }),
			E('2026-01-02', { sleep_h: null, energy: 4 })
		];
		expect(sleepEnergyBuckets(entries, 30, TODAY)).toHaveLength(0);
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
		expect(metricSeries([], 'water_ml', 30, TODAY)).toEqual([]);
	});
});

describe('metricAverage', () => {
	it('mittelt nur erfasste Tage', () => {
		expect(
			metricAverage([E('2026-01-09', { water_ml: 1000 }), E('2026-01-10', { water_ml: 2000 })], 'water_ml', 7, TODAY)
		).toBe(1500);
	});
	it('gibt null ohne Werte', () => {
		expect(metricAverage([E('2026-01-10')], 'sleep_h', 7, TODAY)).toBeNull();
	});
});

describe('goalHitDays', () => {
	it('zaehlt erreichte gegen erfasste Tage', () => {
		const entries = [
			E('2026-01-08', { water_ml: 2000 }),
			E('2026-01-09', { water_ml: 1250 }),
			E('2026-01-10', { water_ml: 2250 }),
			E('2026-01-07')
		];
		expect(goalHitDays(entries, 'water_ml', 2000, 30, TODAY)).toEqual({ hit: 2, tracked: 3 });
	});
	it('zaehlt nichts ohne Ziel', () => {
		expect(goalHitDays([E('2026-01-10', { water_ml: 2000 })], 'water_ml', 0, 30, TODAY).hit).toBe(0);
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
		expect(formatMetric('water_ml', 250, { waterUnit: 'glasses', glassSizeMl: 250 })).toBe('1 Glas');
		expect(formatMetric('water_ml', 2000, { waterUnit: 'glasses', glassSizeMl: 250 })).toBe('8 Gläser');
		expect(formatMetric('energy', 4)).toBe('4/5');
		expect(formatMetric('sleep_h', null)).toBe('—');
	});
});
