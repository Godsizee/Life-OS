import { toISODate } from '$lib/core/date';
import type { JournalEntry } from './types';

export function isValidEntryDate(date: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

const MS_PER_DAY = 86_400_000;
const MILLIS_PER_MINUTE = 60_000;

export interface StreakInfo {
	current: number;
	longest: number;
	isActive: boolean;
	total: number;
}

/** 
 * Eine Streak reißt erst ab, wenn GESTERN gefehlt hat (is_active = true, wenn heute
 * ODER gestern geloggt wurde).
 */
export function calculateJournalStreak(entries: JournalEntry[], todayIso = toISODate(new Date())): StreakInfo {
	const dailies = entries
		.filter((e) => e.kind === 'daily' && isValidEntryDate(e.date))
		.map((e) => e.date)
		.sort((a, b) => b.localeCompare(a)); // neueste zuerst

	const unique = [...new Set(dailies)];
	if (unique.length === 0) return { current: 0, longest: 0, isActive: false, total: 0 };

	const todayMs = Math.floor(
		(new Date(todayIso).getTime() - new Date().getTimezoneOffset() * MILLIS_PER_MINUTE) / MS_PER_DAY
	);

	let current = 0;
	let longest = 0;
	let tempStreak = 0;
	let lastMs: number | null = null;
	let isActive = false;
	let trackingCurrent = false;

	for (let i = 0; i < unique.length; i++) {
		const dMs = Math.floor(
			(new Date(unique[i]).getTime() - new Date().getTimezoneOffset() * MILLIS_PER_MINUTE) / MS_PER_DAY
		);

		if (i === 0) {
			const diffToToday = todayMs - dMs;
			isActive = diffToToday <= 1; // Heute oder gestern reicht
			trackingCurrent = isActive;
			tempStreak = 1;
			if (isActive) current = 1;
		} else if (lastMs !== null) {
			const diff = lastMs - dMs;
			if (diff === 1) {
				tempStreak++;
				if (trackingCurrent) current = tempStreak;
			} else if (diff > 1) {
				if (tempStreak > longest) longest = tempStreak;
				trackingCurrent = false;
				tempStreak = 1;
			}
		}
		lastMs = dMs;
	}

	if (tempStreak > longest) longest = tempStreak;

	return {
		current,
		longest,
		isActive,
		total: unique.length
	};
}

/** Findet Einträge vom exakt gleichen Tag/Monat in der Vergangenheit (inklusive Wochen-Reviews). */
export function getOnThisDay(entries: JournalEntry[], todayIso = toISODate(new Date())): JournalEntry[] {
	const [, mm, dd] = todayIso.split('-');
	const targetSuffix = `-${mm}-${dd}`;
	return entries.filter((e) => e.date < todayIso && e.date.endsWith(targetSuffix));
}
