import type { TimelineEintrag } from '#lib/core/modul.js';
import { isCompleted, type HabitDay } from './streak.js';
import type { Habit, HabitLog } from './types.js';

/** Erledigte Routinen im Fenster. `herkunft` zeigt `AUTO`, wenn eine Regel den Tag abgehakt hat. Rein. */
export function routinenVerlauf(
	logs: HabitLog[],
	habits: Habit[],
	von: string,
	bis: string
): TimelineEintrag[] {
	const out: TimelineEintrag[] = [];
	for (const log of logs) {
		if (log.date < von || log.date > bis) continue;
		const habit = habits.find((h) => h.id === log.habit_id);
		if (!habit || !isCompleted(habit, log as unknown as HabitDay)) continue;
		out.push({
			id: `habit_${log.id}`,
			modul: 'habits',
			zeit: log.date,
			titel: `Routine erledigt: "${habit.name}"`,
			href: `/habits/${habit.id}`,
			herkunft: log.source && log.source !== 'manual' ? log.source : undefined
		});
	}
	return out;
}
