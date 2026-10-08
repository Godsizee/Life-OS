import type { TimelineEintrag } from '#lib/core/modul.js';
import { activityLabel } from './activities.js';
import type { MoodEntry } from './types.js';

export function stimmungVerlauf(moods: MoodEntry[], von: string, bis: string): TimelineEintrag[] {
	const out: TimelineEintrag[] = [];
	for (const m of moods) {
		if (m.date < von || m.date > bis) continue;
		const tags = (m.activities ?? []).map((a) => activityLabel(a));
		const beschreibung = [m.note, tags.length > 0 ? tags.join(' · ') : null]
			.filter(Boolean)
			.join(' — ');
		out.push({
			id: `mood_${m.id}`,
			modul: 'mood',
			zeit: m.date,
			titel: `Stimmung eingetragen: ${m.score}/5`,
			untertitel: beschreibung || undefined,
			href: '/mood'
		});
	}
	return out;
}
