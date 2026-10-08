import { toISODate } from '#lib/core/date.js';
import type { TimelineEintrag } from '#lib/core/modul.js';
import type { Note } from './types.js';

export function notizenVerlauf(notes: Note[], von: string, bis: string): TimelineEintrag[] {
	const out: TimelineEintrag[] = [];
	for (const n of notes) {
		const tag = toISODate(new Date(n.created_at));
		if (tag < von || tag > bis) continue;
		out.push({
			id: `note_${n.id}`,
			modul: 'notes',
			zeit: tag,
			titel: `Notiz angelegt: "${n.title}"`,
			untertitel: n.private ? 'Privat' : undefined,
			href: `/notes?note=${n.id}`
		});
	}
	return out;
}
