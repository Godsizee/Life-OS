import { describe, expect, it } from 'vitest';
import { termineVerlauf } from '#lib/features/calendar/timeline.js';
import { trainingVerlauf } from '#lib/features/fitness/timeline.js';
import { fokusVerlauf } from '#lib/features/focus/timeline.js';
import { tagebuchVerlauf, zieleVerlauf } from '#lib/features/goals/timeline.js';
import { routinenVerlauf } from '#lib/features/habits/timeline.js';
import { gesundheitVerlauf } from '#lib/features/health/timeline.js';
import { stimmungVerlauf } from '#lib/features/mood/timeline.js';
import { notizenVerlauf } from '#lib/features/notes/timeline.js';
import { aufgabenVerlauf } from '#lib/features/tasks/timeline.js';
import { TIMELINE_MODULE_IDS } from './module-ids';
import { alsAnzeige } from './build';

describe('Modul-Abdeckung', () => {
	it('jede erzeugte Modul-ID steht in TIMELINE_MODULE_IDS und alle IDs kommen vor', () => {
		const spaet = new Date(2026, 6, 31, 23, 45).toISOString();
		const von = '2026-01-01';
		const bis = '2026-12-31';

		const eintraege = [
			...aufgabenVerlauf(
				[
					{
						id: 't1',
						title: 'Test',
						status: 'done',
						completed_at: spaet,
						updated_at: spaet
					} as never
				],
				von,
				bis
			),
			...routinenVerlauf(
				[{ id: 'hl1', date: '2026-07-31', habit_id: 'h1', status: 'done', value: 1 } as never],
				[{ id: 'h1', name: 'Habit', schedule: { type: 'daily' }, target_value: 1 } as never],
				von,
				bis
			),
			...stimmungVerlauf([{ id: 'm1', date: '2026-07-31', score: 5 } as never], von, bis),
			...zieleVerlauf(
				[{ id: 'g1', title: 'Goal', status: 'done', updated_at: spaet } as never],
				[{ id: 'c1', goal_id: 'g1', value: 5, created_at: spaet } as never],
				von,
				bis
			),
			...tagebuchVerlauf(
				[{ id: 'j1', date: '2026-07-31', kind: 'daily', context: { mood: 5 } } as never],
				von,
				bis
			),
			...gesundheitVerlauf([{ id: 'he1', date: '2026-07-31', weight_kg: 80 } as never], von, bis),
			...notizenVerlauf([{ id: 'n1', title: 'Note', created_at: spaet } as never], von, bis),
			...trainingVerlauf(
				[{ id: 'w1', date: '2026-07-31', plan_id: 'p1' } as never],
				[{ id: 'p1', name: 'Plan' } as never],
				von,
				bis
			),
			...termineVerlauf(
				[
					{
						id: 'e1',
						title: 'Event',
						start: spaet,
						end: spaet,
						all_day: false,
						rrule: null
					} as never
				],
				[],
				von,
				bis
			),
			...fokusVerlauf(
				[{ started_at: spaet, duration_min: 25, source: 'pomodoro' } as never],
				von,
				bis
			)
		];

		const erzeugt = new Set(alsAnzeige(eintraege).map((i) => i.module));
		for (const id of erzeugt) expect(TIMELINE_MODULE_IDS).toContain(id);
		// Und umgekehrt: die Testdaten decken alle Module ab.
		expect(erzeugt.size).toBe(TIMELINE_MODULE_IDS.length);
		// Kein Beitrag fällt beim Übersetzen weg.
		expect(alsAnzeige(eintraege)).toHaveLength(eintraege.length);
	});
});
