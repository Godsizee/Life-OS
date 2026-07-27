import { describe, expect, it } from 'vitest';
import { calculateJournalStreak, getOnThisDay, isValidEntryDate } from './journal-stats';
import type { JournalEntry } from './types';

// Fake-Eintrag für die Tests
function e(date: string, kind: 'daily' | 'weekly' = 'daily'): JournalEntry {
	return {
		id: date,
		workspace_id: 'w1',
		user_id: 'u1',
		date,
		kind,
		mood: null,
		body: '',
		context: null,
		created_at: '',
		updated_at: ''
	};
}

describe('isValidEntryDate', () => {
	it('accepts yyyy-mm-dd', () => {
		expect(isValidEntryDate('2026-07-28')).toBe(true);
	});
	it('rejects poison pills', () => {
		expect(isValidEntryDate('week-2026-W30')).toBe(false);
		expect(isValidEntryDate('2026-7-2')).toBe(false);
		expect(isValidEntryDate('hello')).toBe(false);
	});
});

describe('calculateJournalStreak', () => {
	const today = '2026-07-20';

	it('returns 0 for empty lists', () => {
		const s = calculateJournalStreak([], today);
		expect(s.current).toBe(0);
		expect(s.isActive).toBe(false);
		expect(s.total).toBe(0);
	});

	it('counts consecutive days and marks active if yesterday was logged', () => {
		// 18., 19. (gestern) -> Streak = 2, active = true
		const s = calculateJournalStreak([e('2026-07-19'), e('2026-07-18')], today);
		expect(s.current).toBe(2);
		expect(s.isActive).toBe(true);
		expect(s.total).toBe(2);
	});

	it('breaks the current streak if yesterday is missing', () => {
		// 17., 18. (vorgestern) -> Streak = 0, active = false, longest = 2
		const s = calculateJournalStreak([e('2026-07-18'), e('2026-07-17')], today);
		expect(s.current).toBe(0);
		expect(s.isActive).toBe(false);
		expect(s.longest).toBe(2);
	});

	it('ignores weekly entries for streaks', () => {
		// weekly von heute zählt NICHT als Log für den Tages-Streak
		const s = calculateJournalStreak([e(today, 'weekly')], today);
		expect(s.current).toBe(0);
		expect(s.isActive).toBe(false);
	});

	it('handles gaps and finds the longest streak', () => {
		const list = [
			e('2026-07-19'),
			e('2026-07-18'),
			// gap
			e('2026-07-15'),
			e('2026-07-14'),
			e('2026-07-13'),
			e('2026-07-12')
		];
		const s = calculateJournalStreak(list, today);
		expect(s.current).toBe(2);
		expect(s.longest).toBe(4);
		expect(s.total).toBe(6);
	});
});

describe('getOnThisDay', () => {
	const today = '2026-07-15';

	it('finds entries from exact same day/month in past years', () => {
		const list = [
			e('2025-07-15'),
			e('2024-07-15', 'weekly'), // weekly is included
			e('2026-07-15'), // today (ignored)
			e('2025-08-15') // different month
		];
		const found = getOnThisDay(list, today);
		expect(found).toHaveLength(2);
		expect(found.map((f) => f.date)).toContain('2025-07-15');
		expect(found.map((f) => f.date)).toContain('2024-07-15');
	});
});
