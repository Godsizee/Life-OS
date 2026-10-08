import type { ScoreWert } from '#lib/core/score.js';
import {
	focusScoreForDate,
	formatMinutes,
	minutesOnDate,
	type TimeEntryLike
} from '#lib/features/timetracking/stats.js';

export function fokusScore(entries: TimeEntryLike[], datum: string, tagesziel: number): ScoreWert {
	const min = minutesOnDate(entries, datum);
	return {
		wert: focusScoreForDate(entries, datum, tagesziel),
		erklaerung: `${formatMinutes(min)} fokussiert, Tagesziel ${formatMinutes(tagesziel)}.`
	};
}

export function fokusKontext(entries: TimeEntryLike[], datum: string) {
	return { focus_minutes: minutesOnDate(entries, datum) };
}
