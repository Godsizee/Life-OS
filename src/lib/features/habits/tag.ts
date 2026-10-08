import { fromISODate } from '#lib/core/date.js';
import type { ScoreWert } from '#lib/core/score.js';
import { isCompleted, isDueOn, isSkipped, type HabitCore, type HabitDay } from './streak.js';

type Routine = HabitCore & { id: string; archived?: boolean };

/** Am Tag fällige Routinen (übersprungene fallen komplett heraus) und wie viele davon erledigt sind. */
export function routinenAmTag(
	habits: Routine[],
	tageVon: (habitId: string) => HabitDay[],
	datum: string
): { faellig: number; erledigt: number } {
	const tag = fromISODate(datum);
	if (!tag) return { faellig: 0, erledigt: 0 };
	let faellig = 0;
	let erledigt = 0;
	for (const h of habits) {
		if (h.archived) continue;
		const tagEintrag = tageVon(h.id).find((d) => d.date === datum);
		if (isSkipped(tagEintrag)) continue;
		if (!isDueOn(h.schedule, tag)) continue;
		faellig++;
		if (isCompleted(h, tagEintrag)) erledigt++;
	}
	return { faellig, erledigt };
}

export function routinenScore(
	habits: Routine[],
	tageVon: (habitId: string) => HabitDay[],
	datum: string
): ScoreWert {
	const { faellig, erledigt } = routinenAmTag(habits, tageVon, datum);
	if (faellig === 0) return { wert: null, erklaerung: 'An diesem Tag war keine Routine fällig.' };
	return {
		wert: (erledigt / faellig) * 100,
		erklaerung: `${erledigt} von ${faellig} fälligen Routinen erledigt. Übersprungene zählen nicht.`
	};
}

export function routinenKontext(
	habits: Routine[],
	tageVon: (habitId: string) => HabitDay[],
	datum: string
) {
	const { faellig, erledigt } = routinenAmTag(habits, tageVon, datum);
	return { habits_logged: erledigt, habits_due: faellig };
}
