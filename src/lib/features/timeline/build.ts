import type { TimelineEintrag } from '#lib/core/modul.js';
import { TIMELINE_MODULE_IDS, type TimelineModule } from './module-ids';
import type { TimelineGroup, TimelineItem } from './types';

const istVerlaufsModul = (id: string): id is TimelineModule =>
	(TIMELINE_MODULE_IDS as readonly string[]).includes(id);

/** Beiträge der Module (core/modul.ts) in die Anzeigeform; Module ohne Filter-Chip entfallen. */
export function alsAnzeige(eintraege: TimelineEintrag[]): TimelineItem[] {
	return eintraege.flatMap((e) =>
		istVerlaufsModul(e.modul)
			? [
					{
						id: e.id,
						date: e.zeit,
						title: e.titel,
						description: e.untertitel,
						module: e.modul,
						href: e.href,
						herkunft: e.herkunft
					}
				]
			: []
	);
}

/** Gruppiert nach Tag. Erwartet bereits gefilterte Einträge. */
export function groupByDay(items: TimelineItem[]): TimelineGroup[] {
	const groups: Record<string, TimelineItem[]> = {};

	items.forEach((item) => {
		if (!groups[item.date]) groups[item.date] = [];
		groups[item.date].push(item);
	});

	return Object.entries(groups)
		.map(([date, groupItems]) => ({ date, items: groupItems }))
		.sort((a, b) => b.date.localeCompare(a.date));
}
