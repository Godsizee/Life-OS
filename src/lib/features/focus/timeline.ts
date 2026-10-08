import type { TimelineEintrag } from '#lib/core/modul.js';
import {
	entryDate,
	formatMinutes,
	minutesOf,
	pomodorosOnDate,
	type TimeEntryLike
} from '#lib/features/timetracking/stats.js';

/** Fokuszeit je Tag zusammengefasst, nicht je Runde. Rein. */
export function fokusVerlauf(
	entries: TimeEntryLike[],
	von: string,
	bis: string
): TimelineEintrag[] {
	const proTag = new Map<string, number>();
	for (const e of entries) {
		const tag = entryDate(e);
		if (tag >= von && tag <= bis) proTag.set(tag, (proTag.get(tag) ?? 0) + minutesOf(e));
	}
	const out: TimelineEintrag[] = [];
	for (const [tag, minuten] of proTag) {
		if (minuten <= 0) continue;
		const runden = pomodorosOnDate(entries, tag);
		out.push({
			id: `focus_${tag}`,
			modul: 'focus',
			zeit: tag,
			titel: `${formatMinutes(minuten)} fokussiert`,
			untertitel: runden > 0 ? `${runden} Runde${runden !== 1 ? 'n' : ''}` : undefined,
			href: '/focus'
		});
	}
	return out;
}
