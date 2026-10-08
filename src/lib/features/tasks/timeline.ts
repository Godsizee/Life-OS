import { toISODate } from '#lib/core/date.js';
import type { TimelineEintrag } from '#lib/core/modul.js';
import { istErledigt } from './status.js';
import type { Task } from './types.js';

/** Erledigte Aufgaben im Fenster (`von`/`bis` als 'yyyy-mm-dd', inklusiv). Rein. */
export function aufgabenVerlauf(tasks: Task[], von: string, bis: string): TimelineEintrag[] {
	const out: TimelineEintrag[] = [];
	for (const t of tasks) {
		if (!istErledigt(t) || !(t.completed_at || t.updated_at)) continue;
		const tag = toISODate(new Date(t.completed_at ?? t.updated_at));
		if (tag < von || tag > bis) continue;
		out.push({
			id: `task_${t.id}`,
			modul: 'tasks',
			zeit: tag,
			titel: `Aufgabe abgeschlossen: "${t.title}"`,
			href: `/tasks?task=${t.id}`
		});
	}
	return out;
}
