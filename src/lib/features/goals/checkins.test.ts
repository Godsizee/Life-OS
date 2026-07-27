import { describe, expect, it } from 'vitest';
import {
	checkinValue,
	cumulativePoints,
	daysSinceLastCheckin,
	diffDays,
	evaluateTrack,
	formatTargetProgress,
	lastCheckinDate,
	milestonePercent,
	sumCheckins,
	targetPercent,
	type CheckinLike,
	type TrackableGoal
} from './checkins';
import { toISODate } from '$lib/core/date';

// Mittwoch, 15.07.2026, 10:00 lokal
const today = new Date(2026, 6, 15, 10, 0, 0);

function daysAgo(n: number): string {
	return toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - n));
}

function goal(partial: Partial<TrackableGoal> = {}): TrackableGoal {
	return {
		created_at: new Date(2026, 6, 1, 8, 0, 0).toISOString(),
		target_date: '2026-07-31',
		status: 'open',
		...partial
	};
}

describe('checkinValue', () => {
	it('accepts the numeric-as-string form PostgREST can return', () => {
		expect(checkinValue({ date: daysAgo(0), value: '2.5' })).toBe(2.5);
	});

	it('treats invalid or non-positive values as zero', () => {
		expect(checkinValue({ date: daysAgo(0), value: 'x' })).toBe(0);
		expect(checkinValue({ date: daysAgo(0), value: -3 })).toBe(0);
		expect(checkinValue({ date: daysAgo(0), value: 0 })).toBe(0);
	});
});

describe('sumCheckins / targetPercent', () => {
	const list: CheckinLike[] = [
		{ date: daysAgo(2), value: 3 },
		{ date: daysAgo(1), value: '4' },
		{ date: daysAgo(0), value: 1 }
	];

	it('sums defensively', () => {
		expect(sumCheckins(list)).toBe(8);
	});

	it('maps the sum onto 0..100', () => {
		expect(targetPercent(12, 8)).toBe(67);
		expect(targetPercent(12, 0)).toBe(0);
	});

	it('caps at 100 and survives a missing target', () => {
		expect(targetPercent(5, 99)).toBe(100);
		expect(targetPercent(null, 99)).toBe(0);
		expect(targetPercent(0, 99)).toBe(0);
	});
});

describe('diffDays', () => {
	it('counts whole local calendar days', () => {
		expect(diffDays(new Date(2026, 6, 15, 23, 0), new Date(2026, 6, 14, 1, 0))).toBe(1);
		expect(diffDays(new Date(2026, 6, 14), new Date(2026, 6, 15))).toBe(-1);
	});
});

describe('evaluateTrack', () => {
	it('reports done goals without any interpolation', () => {
		expect(evaluateTrack(goal({ status: 'done' }), 40, today).state).toBe('done');
	});

	it('reports no_date when the goal has no target date', () => {
		expect(evaluateTrack(goal({ target_date: null }), 40, today).state).toBe('no_date');
	});

	it('interpolates the expected progress linearly', () => {
		// 01.07. -> 31.07. = 30 Tage, am 15.07. sind 14 Tage vorbei -> 47 %
		expect(evaluateTrack(goal(), 47, today).expected).toBe(47);
	});

	it('classifies ahead / on_track / behind against the tolerance', () => {
		expect(evaluateTrack(goal(), 60, today).state).toBe('ahead');
		expect(evaluateTrack(goal(), 45, today).state).toBe('on_track');
		expect(evaluateTrack(goal(), 20, today).state).toBe('behind');
	});

	it('marks an unfinished goal past its target date as overdue', () => {
		const result = evaluateTrack(goal({ target_date: '2026-07-10' }), 80, today);
		expect(result.state).toBe('overdue');
		expect(result.daysLeft).toBe(-5);
	});

	it('never divides by zero when start and target are the same day', () => {
		const sameDay = goal({
			created_at: new Date(2026, 6, 15, 8, 0).toISOString(),
			target_date: '2026-07-15'
		});
		expect(evaluateTrack(sameDay, 100, today).expected).toBe(100);
	});
});

describe('cumulativePoints', () => {
	it('returns one point per day, ending today', () => {
		const points = cumulativePoints([], 7, today);
		expect(points).toHaveLength(7);
		expect(points[6].date).toBe(toISODate(today));
	});

	it('accumulates and never decreases', () => {
		const points = cumulativePoints(
			[
				{ date: daysAgo(3), value: 2 },
				{ date: daysAgo(1), value: 3 }
			],
			7,
			today
		);
		expect(points[6].value).toBe(5);
		for (let i = 1; i < points.length; i++) {
			expect(points[i].value).toBeGreaterThanOrEqual(points[i - 1].value);
		}
	});

	it('carries check-ins from before the window as the starting value', () => {
		const points = cumulativePoints([{ date: daysAgo(40), value: 9 }], 7, today);
		expect(points[0].value).toBe(9);
		expect(points[6].value).toBe(9);
	});
});

describe('formatTargetProgress', () => {
	it('renders value, target and unit', () => {
		expect(formatTargetProgress(7, 12, 'Bücher')).toBe('7 / 12 Bücher');
	});

	it('drops the target when there is none', () => {
		expect(formatTargetProgress(7.5, null, 'km')).toBe('7.5 km');
	});

	it('survives a missing unit', () => {
		expect(formatTargetProgress(3, 10, null)).toBe('3 / 10');
	});
});

describe('lastCheckinDate / daysSinceLastCheckin', () => {
	it('finds the newest date regardless of input order', () => {
		const list = [{ date: daysAgo(5), value: 1 }, { date: daysAgo(2), value: 1 }];
		expect(lastCheckinDate(list)).toBe(daysAgo(2));
		expect(daysSinceLastCheckin(list, today)).toBe(2);
	});

	it('returns null without check-ins', () => {
		expect(lastCheckinDate([])).toBeNull();
		expect(daysSinceLastCheckin([], today)).toBeNull();
	});
});

describe('milestonePercent', () => {
	it('counts done children', () => {
		expect(milestonePercent([{ status: 'done' }, { status: 'open' }])).toBe(50);
		expect(milestonePercent([])).toBe(0);
	});
});
