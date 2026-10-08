import type { TimelineEintrag } from '#lib/core/modul.js';
import type { HealthEntry } from './types.js';

export function gesundheitVerlauf(
	entries: HealthEntry[],
	von: string,
	bis: string
): TimelineEintrag[] {
	const out: TimelineEintrag[] = [];
	for (const h of entries) {
		if (h.date < von || h.date > bis) continue;
		const details: string[] = [];
		if (h.weight_kg) details.push(`${h.weight_kg} kg`);
		if (h.sleep_h) details.push(`${h.sleep_h} Std. Schlaf`);
		if (details.length === 0) continue;
		out.push({
			id: `health_${h.id}`,
			modul: 'health',
			zeit: h.date,
			titel: 'Gesundheitswerte erfasst',
			untertitel: details.join(' · '),
			href: '/health'
		});
	}
	return out;
}
