import type { ScoreWert } from '#lib/core/score.js';
import type { Goal, JournalEntry } from './types.js';

/** Durchschnittlicher Fortschritt der offenen Ziele; ohne offenes Ziel `null`. */
export function zieleScore(goals: Goal[], fortschritt: (g: Goal) => number): ScoreWert {
	const offen = goals.filter((g) => g.status === 'open' && !g.archived);
	if (offen.length === 0) return { wert: null, erklaerung: 'Es gibt kein offenes Ziel.' };
	const summe = offen.reduce((s, g) => s + fortschritt(g), 0);
	return {
		wert: summe / offen.length,
		erklaerung: `Durchschnittlicher Fortschritt von ${offen.length} offenen Zielen.`
	};
}

/** Ohne Eintrag `null` (früher 0). */
export function tagebuchScore(eintrag: JournalEntry | undefined): ScoreWert {
	return eintrag
		? { wert: 100, erklaerung: 'Für diesen Tag gibt es einen Tagebucheintrag.' }
		: { wert: null, erklaerung: 'Für diesen Tag gibt es keinen Tagebucheintrag.' };
}
