import { toISODate } from '#lib/core/date.js';
import type { TimelineEintrag } from '#lib/core/modul.js';
import type { Goal, GoalCheckin, JournalEntry } from './types.js';

/** Erreichte Ziele und Check-ins im Fenster. Rein. */
export function zieleVerlauf(
	goals: Goal[],
	checkins: GoalCheckin[],
	von: string,
	bis: string
): TimelineEintrag[] {
	const out: TimelineEintrag[] = [];
	const imFenster = (tag: string) => tag >= von && tag <= bis;

	for (const g of goals) {
		if (g.status !== 'done' || !g.updated_at) continue;
		const tag = toISODate(new Date(g.updated_at));
		if (!imFenster(tag)) continue;
		out.push({
			id: `goal_${g.id}`,
			modul: 'goals',
			zeit: tag,
			titel: `Ziel erreicht: "${g.title}"`,
			untertitel: g.description ?? undefined,
			href: `/goals/${g.id}`
		});
	}

	for (const c of checkins) {
		const tag = toISODate(new Date(c.created_at));
		if (!imFenster(tag)) continue;
		const goal = goals.find((g) => g.id === c.goal_id);
		out.push({
			id: `checkin_${c.id}`,
			modul: 'goals',
			zeit: tag,
			titel: `Check-in: ${goal?.title ?? 'Ziel'}`,
			untertitel: `${c.value} ${goal?.target_unit ?? ''}`.trim(),
			href: goal ? `/goals/${goal.id}` : '/goals',
			herkunft: c.source && c.source !== 'manual' ? c.source : undefined
		});
	}
	return out;
}

export function tagebuchVerlauf(
	journal: JournalEntry[],
	von: string,
	bis: string
): TimelineEintrag[] {
	return journal
		.filter((j) => j.date >= von && j.date <= bis)
		.map((j) => ({
			id: `journal_${j.id}`,
			modul: 'journal' as const,
			zeit: j.date,
			titel: j.kind === 'daily' ? 'Tagebuch-Eintrag' : 'Wochenrückblick',
			untertitel: j.context?.mood ? `Stimmung: ${j.context.mood}/5` : undefined,
			href: '/journal'
		}));
}
