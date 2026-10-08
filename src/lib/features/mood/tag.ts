import type { ScoreWert } from '#lib/core/score.js';
import type { MoodEntry } from './types.js';

/** Ohne Eintrag `null`: Wer nichts einträgt, hat keinen schlechten Tag. */
export function stimmungScore(entries: MoodEntry[], datum: string): ScoreWert {
	const e = entries.find((x) => x.date === datum);
	if (!e) return { wert: null, erklaerung: 'Für diesen Tag gibt es keinen Stimmungseintrag.' };
	return { wert: (e.score / 5) * 100, erklaerung: `Stimmung ${e.score} von 5.` };
}

export function stimmungKontext(entries: MoodEntry[], datum: string) {
	const e = entries.find((x) => x.date === datum);
	return { mood: e?.score ?? null, mood_activities: e?.activities ?? [] };
}
