// Fortschritt von Rekord- und Häufigkeitszielen aus Trainingsergebnissen.
// Übernommen aus fitness/integration.ts (T205): dieselbe Logik, jetzt rein und testbar —
// ausgelöst über die Regeln sys:rekord-ziel und sys:frequenz-ziel statt versteckt im Fitness-Store.
import { frequenzScoreAusAnzahl } from '#lib/features/fitness/utils/frequency.js';

export interface ZielKern {
	id: string;
	title: string;
	goal_type: string;
	status: string;
	progress: number;
	target_exercise: string | null;
	target_value: number | null;
}

export interface FortschrittsAenderung {
	id: string;
	titel: string;
	alt: number;
	neu: number;
}

/** Rekord-Ziele (`pr`) für genau diese Übung. Nur steigern, nie senken. */
export function rekordAenderungen(
	ziele: ZielKern[],
	uebung: string,
	e1rmKg: number
): FortschrittsAenderung[] {
	const out: FortschrittsAenderung[] = [];
	for (const g of ziele) {
		if (g.goal_type !== 'pr' || g.status === 'done') continue;
		if (!g.target_exercise || g.target_exercise.toLowerCase() !== uebung.toLowerCase()) continue;
		if (!g.target_value || g.target_value <= 0) continue;
		const neu = Math.min(100, Math.round((e1rmKg / g.target_value) * 100));
		if (neu > g.progress) out.push({ id: g.id, titel: g.title, alt: g.progress, neu });
	}
	return out;
}

/** Häufigkeitsziele (`fitness_frequency`): gleiche Formel wie der Life-Score. Nur steigern. */
export function frequenzAenderungen(
	ziele: ZielKern[],
	trainingstage: number,
	jetzt: Date
): FortschrittsAenderung[] {
	const out: FortschrittsAenderung[] = [];
	for (const g of ziele) {
		if (g.goal_type !== 'fitness_frequency' || g.status === 'done' || !g.target_value) continue;
		const neu = frequenzScoreAusAnzahl(trainingstage, g.target_value, jetzt);
		if (neu > g.progress) out.push({ id: g.id, titel: g.title, alt: g.progress, neu });
	}
	return out;
}
