import { describe, expect, it } from 'vitest';
import { TIMELINE_MODULE_IDS } from './module-ids';
import { buildTimeline } from './build';
import type { TimelineQuellen } from './types';

describe('Modul-Abdeckung', () => {
	it('jede von buildTimeline erzeugte module-ID steht in TIMELINE_MODULE_IDS', () => {
		const spaet = new Date(2026, 6, 31, 23, 45).toISOString();
		const vollstaendigeTestdaten: TimelineQuellen = {
			tasks: [{ id: 't1', title: 'Test', status: 'done', completed_at: spaet, updated_at: spaet } as never],
			habitLogs: [{ id: 'hl1', date: '2026-07-31', habit_id: 'h1', status: 'done', value: 1 } as never],
			habits: [{ id: 'h1', name: 'Habit', schedule: { type: 'daily' }, target_value: 1 } as never],
			moods: [{ id: 'm1', date: '2026-07-31', score: 5 } as never],
			goals: [{ id: 'g1', title: 'Goal', status: 'done', updated_at: spaet } as never],
			health: [{ id: 'he1', date: '2026-07-31', weight_kg: 80 } as never],
			notes: [{ id: 'n1', title: 'Note', created_at: spaet } as never],
			workouts: [{ id: 'w1', date: '2026-07-31', plan_id: 'p1' } as never],
			plans: [{ id: 'p1', name: 'Plan' } as never],
			events: [{ id: 'e1', title: 'Event', start: spaet, end: spaet, all_day: false, rrule: null } as never],
			overrides: [],
			timeEntries: [{ started_at: spaet, duration_min: 25, source: 'pomodoro' } as never],
			checkins: [{ id: 'c1', goal_id: 'g1', value: 5, created_at: spaet } as never],
			journal: [{ id: 'j1', date: '2026-07-31', kind: 'daily', context: { mood: 5 } } as never]
		};

		const items = buildTimeline(vollstaendigeTestdaten, { von: '2026-01-01', bis: '2026-12-31' });
		
		const erzeugt = new Set(items.map((i) => i.module));
		for (const id of erzeugt) {
			expect(TIMELINE_MODULE_IDS).toContain(id);
		}
		
		// Und umgekehrt: die Testdaten decken alle Module ab.
		expect(erzeugt.size).toBe(TIMELINE_MODULE_IDS.length);
	});
});
