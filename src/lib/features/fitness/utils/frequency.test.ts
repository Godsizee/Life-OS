import { describe, expect, it } from 'vitest';
import { fitnessFrequencyScore, workoutsThisWeek } from './frequency';
import type { WorkoutLog } from '../types';

function log(date: string): WorkoutLog {
	return {
		id: date,
		workspace_id: 'w',
		user_id: 'u',
		plan_id: null,
		date,
		duration_minutes: null,
		notes: null,
		created_at: date
	};
}

// Montag, 2026-06-22
const monday = new Date(2026, 5, 22);
// Donnerstag derselben Woche
const thursday = new Date(2026, 5, 25);

describe('workoutsThisWeek', () => {
	it('counts distinct training days in the current Mon–Sun week only', () => {
		const logs = [log('2026-06-22'), log('2026-06-23'), log('2026-06-15')];
		expect(workoutsThisWeek(logs, thursday)).toBe(2);
	});

	it('deduplicates multiple logs on the same day', () => {
		const logs = [log('2026-06-22'), log('2026-06-22')];
		expect(workoutsThisWeek(logs, thursday)).toBe(1);
	});
});

describe('fitnessFrequencyScore', () => {
	it('reaches 100 once the pro-rata target for the elapsed weekdays is met', () => {
		// Montag (Tag 1/7): Pro-rata-Ziel = 3 * 1/7 ≈ 0.43 → 1 Workout reicht bereits.
		const logs = [log('2026-06-22')];
		expect(fitnessFrequencyScore(logs, 3, monday)).toBe(100);
	});

	it('is 0 with zero workouts logged so far this week', () => {
		expect(fitnessFrequencyScore([], 3, monday)).toBe(0);
	});

	it('caps at 100 even when exceeding the weekly goal', () => {
		const logs = [log('2026-06-22'), log('2026-06-23'), log('2026-06-24'), log('2026-06-25')];
		expect(fitnessFrequencyScore(logs, 3, thursday)).toBe(100);
	});

	it('treats a non-positive weekly goal as always satisfied', () => {
		expect(fitnessFrequencyScore([], 0, thursday)).toBe(100);
	});
});
