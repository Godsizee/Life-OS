import { describe, expect, it } from 'vitest';
import {
	activityStats,
	availableYears,
	averageByWeekday,
	averageScore,
	daysInMonth,
	entriesInYear,
	filterSince,
	formatDelta,
	formatScore,
	moodDistribution,
	mostFrequentActivities,
	topActivities,
	validScore,
	yearPixels,
	type MoodLike
} from './stats';

const E = (date: string, score: number, activities: string[] = []): MoodLike => ({
	date,
	score,
	activities
});

describe('validScore', () => {
	it('akzeptiert 1..5', () => {
		expect(validScore(1)).toBe(1);
		expect(validScore(5)).toBe(5);
	});
	it('verwirft alles andere', () => {
		expect(validScore(0)).toBeNull();
		expect(validScore(6)).toBeNull();
		expect(validScore('x')).toBeNull();
		expect(validScore(null)).toBeNull();
	});
	it('rundet', () => {
		expect(validScore(3.4)).toBe(3);
	});
});

describe('averageScore', () => {
	it('mittelt', () => {
		expect(averageScore([E('2026-01-01', 2), E('2026-01-02', 4)])).toBe(3);
	});
	it('gibt null ohne Daten', () => {
		expect(averageScore([])).toBeNull();
		expect(averageScore([E('2026-01-01', 9)])).toBeNull();
	});
});

describe('moodDistribution', () => {
	it('zaehlt je Score', () => {
		expect(moodDistribution([E('2026-01-01', 1), E('2026-01-02', 5), E('2026-01-03', 5)])).toEqual([
			1, 0, 0, 0, 2
		]);
	});
});

describe('averageByWeekday', () => {
	it('indexiert Montag als 0', () => {
		// 2026-01-05 ist ein Montag, 2026-01-11 ein Sonntag.
		const res = averageByWeekday([E('2026-01-05', 5), E('2026-01-11', 1)]);
		expect(res[0]).toBe(5);
		expect(res[6]).toBe(1);
		expect(res[1]).toBeNull();
	});
});

describe('filterSince', () => {
	it('nimmt genau die letzten n Tage inkl. heute', () => {
		const today = new Date(2026, 0, 10);
		const res = filterSince(
			[E('2026-01-04', 3), E('2026-01-05', 3), E('2026-01-10', 3), E('2026-01-11', 3)],
			7,
			today
		);
		expect(res.map((e) => e.date)).toEqual(['2026-01-04', '2026-01-05', '2026-01-10']);
	});
});

describe('Jahres-Helfer', () => {
	it('filtert nach Jahr', () => {
		expect(entriesInYear([E('2025-12-31', 3), E('2026-01-01', 3)], 2026)).toHaveLength(1);
	});
	it('listet Jahre absteigend inkl. aktuellem', () => {
		expect(availableYears([E('2024-05-05', 3)], 2026)).toEqual([2026, 2024]);
	});
	it('kennt Schaltjahre', () => {
		expect(daysInMonth(2024, 1)).toBe(29);
		expect(daysInMonth(2026, 1)).toBe(28);
	});
});

describe('yearPixels', () => {
	const grid = yearPixels([E('2026-03-15', 4)], 2026, new Date(2026, 6, 1));

	it('hat 12 Monate mit je 31 Slots', () => {
		expect(grid).toHaveLength(12);
		for (const m of grid) expect(m.days).toHaveLength(31);
	});
	it('markiert nicht existierende Tage als null', () => {
		expect(grid[1].days[28]).toBeNull(); // 29. Februar 2026
		expect(grid[0].days[30]).not.toBeNull(); // 31. Januar
	});
	it('traegt den Score am richtigen Tag ein', () => {
		expect(grid[2].days[14]?.score).toBe(4);
		expect(grid[2].days[13]?.score).toBeNull();
	});
	it('markiert Zukunft', () => {
		expect(grid[2].days[14]?.future).toBe(false);
		expect(grid[11].days[0]?.future).toBe(true);
	});
});

describe('activityStats', () => {
	const entries = [
		E('2026-01-01', 5, ['sport', 'freunde']),
		E('2026-01-02', 5, ['sport']),
		E('2026-01-03', 4, ['sport']),
		E('2026-01-04', 1, ['stress']),
		E('2026-01-05', 2, ['stress']),
		E('2026-01-06', 1, ['stress']),
		E('2026-01-07', 3, ['freunde'])
	];

	it('ignoriert Aktivitaeten unter minCount', () => {
		const ids = activityStats(entries).map((s) => s.id);
		expect(ids).toContain('sport');
		expect(ids).toContain('stress');
		expect(ids).not.toContain('freunde'); // nur 2 Tage
	});
	it('rechnet Ø und Delta', () => {
		const sport = activityStats(entries).find((s) => s.id === 'sport')!;
		expect(sport.count).toBe(3);
		expect(sport.avg).toBeCloseTo(14 / 3, 5);
		expect(sport.delta).toBeGreaterThan(0);
	});
	it('sortiert staerksten positiven Effekt zuerst', () => {
		expect(activityStats(entries)[0].id).toBe('sport');
	});
	it('zaehlt Dubletten im selben Eintrag nur einmal', () => {
		const stats = activityStats(
			[
				E('2026-01-01', 4, ['sport', 'sport']),
				E('2026-01-02', 4, ['sport']),
				E('2026-01-03', 4, ['sport'])
			],
			3
		);
		expect(stats.find((s) => s.id === 'sport')!.count).toBe(3);
	});
	it('markiert eigene Tags', () => {
		const stats = activityStats(
			[E('2026-02-01', 4, ['bouldern']), E('2026-02-02', 4, ['bouldern']), E('2026-02-03', 5, ['bouldern'])],
			3
		);
		expect(stats[0].custom).toBe(true);
	});
	it('gibt ohne Daten eine leere Liste', () => {
		expect(activityStats([])).toEqual([]);
	});

	it('topActivities trennt gute und schlechte', () => {
		const stats = activityStats(entries);
		expect(topActivities(stats, 'good').map((s) => s.id)).toEqual(['sport']);
		expect(topActivities(stats, 'bad').map((s) => s.id)).toEqual(['stress']);
	});
});

describe('mostFrequentActivities', () => {
	it('sortiert nach Haeufigkeit', () => {
		expect(
			mostFrequentActivities([
				E('2026-01-01', 3, ['a', 'b']),
				E('2026-01-02', 3, ['b']),
				E('2026-01-03', 3, ['b', 'c'])
			])
		).toEqual(['b', 'a', 'c']);
	});
});

describe('Formatierung', () => {
	it('formatDelta', () => {
		expect(formatDelta(0.64)).toBe('+0.6');
		expect(formatDelta(-1.24)).toBe('−1.2');
		expect(formatDelta(0)).toBe('±0.0');
	});
	it('formatScore mit deutschem Komma', () => {
		expect(formatScore(3.75)).toBe('3,8');
		expect(formatScore(null)).toBe('—');
	});
});
