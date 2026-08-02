import { describe, expect, it } from 'vitest';
import { buildTimeline, groupByDay } from './build';

const leer = {
	tasks: [],
	habitLogs: [],
	habits: [],
	moods: [],
	goals: [],
	health: [],
	notes: [],
	workouts: [],
	plans: [],
	events: [],
	overrides: [],
	timeEntries: [],
	checkins: [],
	journal: []
};

describe('buildTimeline — Datumsableitung', () => {
	it('nutzt das LOKALE Datum, nicht UTC', () => {
		const spaet = new Date(2026, 6, 31, 23, 45).toISOString();
		const r = buildTimeline(
			{ ...leer, tasks: [{ id: 't1', title: 'Test', status: 'done', completed_at: spaet, updated_at: spaet } as never] },
			{ von: '2026-07-01', bis: '2026-07-31' }
		);
		expect(r[0].date).toBe('2026-07-31');
	});
});

describe('buildTimeline — Fenster', () => {
	it('lässt alles außerhalb des Fensters weg', () => {
		const r = buildTimeline(
			{
				...leer,
				notes: [
					{ id: '1', title: 'A', created_at: new Date(2026, 6, 1).toISOString(), private: false } as never,
					{ id: '2', title: 'B', created_at: new Date(2026, 6, 15).toISOString(), private: false } as never,
					{ id: '3', title: 'C', created_at: new Date(2026, 6, 30).toISOString(), private: false } as never
				]
			},
			{ von: '2026-07-10', bis: '2026-07-20' }
		);
		expect(r).toHaveLength(1);
		expect(r[0].title).toContain('B');
	});

	it('schließt Randtage ein (inklusiv)', () => {
		const r = buildTimeline(
			{
				...leer,
				notes: [
					{ id: '1', title: 'A', created_at: new Date(2026, 6, 10).toISOString(), private: false } as never,
					{ id: '2', title: 'B', created_at: new Date(2026, 6, 20).toISOString(), private: false } as never
				]
			},
			{ von: '2026-07-10', bis: '2026-07-20' }
		);
		expect(r).toHaveLength(2);
	});
});

describe('buildTimeline — Fokus', () => {
	it('fasst Fokuszeit je Tag zusammen, statt je Runde', () => {
		const t = (h: number, min: number) =>
			({ started_at: new Date(2026, 6, 31, h).toISOString(), duration_min: min, source: 'pomodoro' as const });
		const r = buildTimeline(
			{ ...leer, timeEntries: [t(9, 25), t(11, 25)] },
			{ von: '2026-07-31', bis: '2026-07-31' }
		);
		const focus = r.filter((i) => i.module === 'focus');
		expect(focus).toHaveLength(1);
		expect(focus[0].title).toContain('50 min');
	});
});

describe('groupByDay', () => {
	it('gruppiert absteigend und behält die Reihenfolge innerhalb des Tages', () => {
		const items = [
			{ id: '1', date: '2026-07-31', title: 'A', module: 'notes' },
			{ id: '2', date: '2026-07-31', title: 'B', module: 'tasks' },
			{ id: '3', date: '2026-07-30', title: 'C', module: 'mood' }
		] as any[];
		const groups = groupByDay(items);
		expect(groups).toHaveLength(2);
		expect(groups[0].date).toBe('2026-07-31');
		expect(groups[0].items).toHaveLength(2);
		expect(groups[1].date).toBe('2026-07-30');
	});

	it('liefert für eine leere Liste ein leeres Array', () => {
		expect(groupByDay([])).toEqual([]);
	});
});
