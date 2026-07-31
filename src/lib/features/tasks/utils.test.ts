import { describe, expect, it } from 'vitest';
import { buildTaskTree, subtaskProgress, smartViewFilter, labelUnion, assignColumnPositions, completedOn, completedBetween, filterTasks } from './utils';
import type { Task } from './types';

const baseTask = {
	workspace_id: 'ws',
	project_id: null,
	goal_id: null,
	parent_id: null,
	title: 'Task',
	description: null,
	labels: [],
	status: 'todo' as const,
	priority: 'medium' as const,
	due_at: null,
	assignee_id: null,
	rrule: null,
	position: 0,
	created_by: 'user',
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	completed_at: null,
	focus_week: null
};

function mkTask(overrides: Partial<Task>): Task {
	return { ...baseTask, id: 'id-' + Math.random().toString(), ...overrides } as Task;
}

describe('buildTaskTree and subtaskProgress', () => {
	it('builds tree and counts progress', () => {
		const parent = mkTask({ id: '1', parent_id: null });
		const child1 = mkTask({ id: '2', parent_id: '1', status: 'done' });
		const child2 = mkTask({ id: '3', parent_id: '1', status: 'todo' });
		const tree = buildTaskTree([parent, child1, child2]);
		expect(tree).toHaveLength(1);
		expect(tree[0].children).toHaveLength(2);
		const prog = subtaskProgress(tree[0].children);
		expect(prog.done).toBe(1);
		expect(prog.total).toBe(2);
	});
});

describe('smartViewFilter', () => {
	it('filters tasks correctly', () => {
		const now = new Date('2026-07-24T12:00:00Z');
		const t1 = mkTask({ id: '1', due_at: '2026-07-24T10:00:00Z' }); // today
		const t2 = mkTask({ id: '2', due_at: '2026-07-25T10:00:00Z' }); // upcoming
		const t3 = mkTask({ id: '3', due_at: null }); // no_date
		const t4 = mkTask({ id: '4', due_at: '2026-07-23T10:00:00Z', status: 'todo' }); // overdue
		const t5 = mkTask({ id: '5', due_at: '2026-07-23T10:00:00Z', status: 'done' }); // overdue but done

		const tasks = [t1, t2, t3, t4, t5];
		expect(smartViewFilter(tasks, 'today', now).map(t => t.id)).toEqual(['1']);
		expect(smartViewFilter(tasks, 'upcoming', now).map(t => t.id)).toEqual(['2']);
		expect(smartViewFilter(tasks, 'no_date', now).map(t => t.id)).toEqual(['3']);
		expect(smartViewFilter(tasks, 'overdue', now).map(t => t.id)).toEqual(['4']);
		expect(smartViewFilter(tasks, 'all', now)).toHaveLength(5);
	});
});

describe('labelUnion', () => {
	it('extracts unique sorted labels', () => {
		const t1 = mkTask({ id: '1', labels: ['b', 'a'] });
		const t2 = mkTask({ id: '2', labels: ['c', 'a'] });
		expect(labelUnion([t1, t2])).toEqual(['a', 'b', 'c']);
	});
});

describe('assignColumnPositions', () => {
	it('assigns positions based on index', () => {
		expect(assignColumnPositions(['a', 'b', 'c'])).toEqual([
			{ id: 'a', position: 0 },
			{ id: 'b', position: 1 },
			{ id: 'c', position: 2 }
		]);
	});
});

describe('completedOn / completedBetween', () => {
	it('zählt nur nach completed_at, nicht nach updated_at', () => {
		const t = mkTask({ status: 'done', completed_at: '2026-03-10T14:00:00Z', updated_at: '2026-07-31T09:00:00Z' });
		expect(completedOn(t, '2026-03-10')).toBe(true);
		expect(completedOn(t, '2026-07-31')).toBe(false);
	});

	it('ignoriert offene Aufgaben', () => {
		expect(completedOn(mkTask({ status: 'todo', completed_at: null }), '2026-07-31')).toBe(false);
	});

	it('rechnet in lokalen Kalendertagen', () => {
		// 23:30 Ortszeit — in UTC bereits der Folgetag.
		const t = mkTask({ status: 'done', completed_at: new Date(2026, 6, 31, 23, 30).toISOString() });
		expect(completedOn(t, '2026-07-31')).toBe(true);
	});
});

describe('filterTasks', () => {
	it('findet in Titel, Beschreibung und Labels', () => {
		const t1 = mkTask({ title: 'Hallo Welt' });
		const t2 = mkTask({ description: 'Dies ist ein Weltbild' });
		const t3 = mkTask({ labels: ['welt'] });
		const t4 = mkTask({ title: 'Nichts' });

		const res = filterTasks([t1, t2, t3, t4], 'welt');
		expect(res).toHaveLength(3);
		expect(res.map(t => t.id)).not.toContain(t4.id);
	});

	it('leerer Query liefert alles zurück', () => {
		const res = filterTasks([mkTask({}), mkTask({})], '   ');
		expect(res).toHaveLength(2);
	});
});
