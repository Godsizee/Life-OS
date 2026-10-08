import { toISODate } from '#lib/core/date.js';
import type { Hinweis } from '#lib/core/modul.js';
import type { WorkoutLog, WorkoutPlan } from './types.js';

const PAUSE_TAGE = 4;

/** `fitness.pause`: Es gibt Trainingspläne, aber seit mindestens vier Tagen kein Workout. */
export function trainingPause(
	plans: Pick<WorkoutPlan, 'id'>[],
	logs: Pick<WorkoutLog, 'date'>[],
	jetzt: Date
): Hinweis[] {
	if (plans.length === 0) return [];
	const letztes =
		logs
			.map((l) => l.date)
			.sort()
			.at(-1) ?? null;
	const grenze = toISODate(
		new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() - PAUSE_TAGE)
	);
	if (letztes && letztes > grenze) return [];
	return [
		{
			id: 'fitness.pause:sammel',
			art: 'fitness.pause',
			titel: 'Zeit fürs nächste Training',
			text: letztes
				? `Dein letztes Workout war am ${letztes.split('-').reverse().join('.')}.`
				: 'Du hast Trainingspläne. Starte, wann es passt.',
			warum: {
				was: letztes
					? `Das letzte Workout liegt mindestens ${PAUSE_TAGE} Tage zurück.`
					: 'Es gibt Pläne, aber noch kein Workout.',
				warumJetzt: `Seit ${PAUSE_TAGE} Tagen oder länger kein Training bei vorhandenem Plan.`,
				daten: [
					letztes ? `Letztes Workout: ${letztes}` : 'Noch kein Workout',
					`Pläne: ${plans.length}`
				],
				steuerung: [{ label: 'Diese Art Hinweis abschalten', href: '/settings#hinweise' }]
			},
			aktion: { label: 'Zum Training', href: '/fitness' },
			prioritaet: 25
		}
	];
}
