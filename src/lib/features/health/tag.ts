import type { ScoreWert } from '#lib/core/score.js';
import { waterMl } from './stats.js';
import type { HealthEntry } from './types.js';

export interface GesundheitsZiele {
	waterGoalMl: number;
	sleepGoalH: number;
}

/**
 * Gewicht, Schlaf (Ziel ± 1 h voll, sonst Teilpunkte fürs Erfassen), Wasser (gegen das Ziel) und
 * Energie, je ein Viertel. Ohne Eintrag am Tag 0, denn die Gesundheit wird bewusst erfasst.
 */
export function gesundheitScore(
	entry: HealthEntry | undefined,
	ziele: GesundheitsZiele
): ScoreWert {
	if (!entry) return { wert: 0, erklaerung: 'Für diesen Tag wurde nichts eingetragen.' };
	let punkte = 0;
	const teile: string[] = [];
	if (entry.weight_kg !== null && entry.weight_kg > 0) {
		punkte += 25;
		teile.push('Gewicht');
	}
	if (entry.sleep_h !== null) {
		const getroffen = Math.abs(entry.sleep_h - ziele.sleepGoalH) <= 1;
		punkte += getroffen ? 25 : 15;
		teile.push(`Schlaf ${entry.sleep_h} h (Ziel ${ziele.sleepGoalH} h)`);
	}
	const wasser = waterMl(entry);
	if (wasser !== null && ziele.waterGoalMl > 0) {
		punkte += Math.min(25, (wasser / ziele.waterGoalMl) * 25);
		teile.push(`Wasser ${wasser} von ${ziele.waterGoalMl} ml`);
	}
	if (entry.energy !== null && entry.energy > 0) {
		punkte += 25;
		teile.push('Energie');
	}
	return {
		wert: punkte,
		erklaerung: teile.length ? `Erfasst: ${teile.join(', ')}.` : 'Eintrag ohne Werte.'
	};
}

export function gesundheitKontext(entry: HealthEntry | undefined) {
	return {
		sleep_h: entry?.sleep_h ?? null,
		water_ml: entry ? waterMl(entry) : null
	};
}
