import { nachUhrzeit } from '#lib/core/date.js';
import type { Hinweis } from '#lib/core/modul.js';
import {
	calculateStreak,
	isOpenToday,
	streakLabel,
	type HabitCore,
	type HabitDay
} from './streak.js';

const MIN_SERIE = 3;

type Routine = HabitCore & { id: string; name: string; archived?: boolean };

/**
 * `habits.serie-offen`: Eine Serie von mindestens drei Einheiten läuft und die Routine ist heute noch
 * offen. Erst ab `abendAb` ('HH:MM'), damit tagsüber nichts drängelt.
 */
export function serieOffen(
	habits: Routine[],
	tageVon: (habitId: string) => HabitDay[],
	jetzt: Date,
	abendAb: string
): Hinweis[] {
	if (!nachUhrzeit(jetzt, abendAb)) return [];
	const out: Hinweis[] = [];
	for (const h of habits) {
		if (h.archived) continue;
		const tage = tageVon(h.id);
		const serie = calculateStreak(h, tage, jetzt);
		if (serie < MIN_SERIE || !isOpenToday(h, tage, jetzt)) continue;
		const laenge = streakLabel(h.schedule, serie);
		out.push({
			id: `habits.serie-offen:${h.id}`,
			art: 'habits.serie-offen',
			titel: `„${h.name}“ ist heute noch offen`,
			text: `Deine Serie läuft seit ${laenge}.`,
			warum: {
				was: `Routine „${h.name}“ ist heute noch offen.`,
				warumJetzt: `Es ist nach ${abendAb} und deine Serie läuft seit ${laenge}.`,
				daten: [`Routine: „${h.name}“`, `Serie: ${laenge}`],
				steuerung: [
					{ label: 'Diese Art Hinweis abschalten', href: '/settings#hinweise' },
					{ label: 'Ab wann Abendhinweise kommen', href: '/settings#heute' }
				]
			},
			aktion: { label: 'Erledigt', href: `/habits/${h.id}` },
			prioritaet: 80
		});
	}
	return out;
}
