import { toISODate } from '#lib/core/date.js';
import type { AgendaEintrag } from '#lib/core/modul.js';
import type { WorkoutLog } from './types';
import { workoutsThisWeek } from './utils/frequency.js';

/**
 * Ein flexibler Eintrag „Training“, nur wenn ein Wochenziel gesetzt ist, heute noch kein Training
 * stattfand und das Ziel noch nicht erreicht ist. Hat ein heutiger Termin einen verknüpften
 * Trainingsplan (`plan`), steht dessen Name im Titel und der Link startet ihn.
 */
export function trainingAgenda(
	logs: Pick<WorkoutLog, 'date'>[],
	wochenziel: number,
	tag: Date,
	plan: { id: string; name: string } | null = null
): AgendaEintrag[] {
	const heute = toISODate(tag);
	if (wochenziel <= 0) return [];
	if (logs.some((l) => l.date === heute)) return [];
	const erledigt = workoutsThisWeek(logs as WorkoutLog[], tag);
	if (erledigt >= wochenziel) return [];
	return [
		{
			key: `fitness:training:${heute}`,
			modul: 'fitness',
			art: 'training',
			titel: plan ? `${plan.name} starten` : 'Training',
			start: null,
			ende: null,
			dauerMin: null,
			erledigt: false,
			href: plan ? `/fitness?startPlan=${plan.id}` : '/fitness',
			warum: `Wochenziel: ${erledigt} von ${wochenziel}`
		}
	];
}
