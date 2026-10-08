import type { TimelineEintrag } from '#lib/core/modul.js';
import type { WorkoutLog, WorkoutPlan } from './types.js';

export function trainingVerlauf(
	logs: WorkoutLog[],
	plans: WorkoutPlan[],
	von: string,
	bis: string
): TimelineEintrag[] {
	const out: TimelineEintrag[] = [];
	for (const log of logs) {
		if (log.date < von || log.date > bis) continue;
		const planName = plans.find((p) => p.id === log.plan_id)?.name ?? 'Freies Training';
		out.push({
			id: `fitness_${log.id}`,
			modul: 'fitness',
			zeit: log.date,
			titel: `Workout absolviert: "${planName}"`,
			untertitel: log.duration_minutes ? `${log.duration_minutes} Min.` : undefined,
			href: `/fitness/log/${log.id}`
		});
	}
	return out;
}
