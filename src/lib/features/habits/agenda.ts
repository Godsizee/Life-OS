import { toISODate } from '#lib/core/date.js';
import type { AgendaEintrag } from '#lib/core/modul.js';
import {
	isCompleted,
	isOpenToday,
	scheduleLabel,
	type HabitCore,
	type HabitDay
} from './streak.js';

type Routine = HabitCore & { id: string; name: string; archived?: boolean };

/**
 * Routinen im Tagesplan, immer flexibel: heute offen oder heute erledigt. Übersprungene und
 * (bei „n mal pro Woche“) bereits erfüllte Wochen fehlen, damit nichts Unerledigtes vorgetäuscht wird.
 */
export function routinenAgenda(
	habits: Routine[],
	tageVon: (habitId: string) => HabitDay[],
	tag: Date
): AgendaEintrag[] {
	const heute = toISODate(tag);
	const eintraege: AgendaEintrag[] = [];
	for (const h of habits) {
		if (h.archived) continue;
		const tage = tageVon(h.id);
		const erledigt = isCompleted(
			h,
			tage.find((d) => d.date === heute)
		);
		if (!erledigt && !isOpenToday(h, tage, tag)) continue;
		eintraege.push({
			key: `habits:${h.id}:${heute}`,
			modul: 'habits',
			art: 'routine',
			titel: h.name,
			start: null,
			ende: null,
			dauerMin: null,
			erledigt,
			href: `/habits/${h.id}`,
			warum: `Routine: ${scheduleLabel(h.schedule)}`
		});
	}
	return eintraege;
}
