import { describe, expect, it } from 'vitest';
import { buildTaskTree, subtaskProgress, smartViewFilter, labelUnion, assignColumnPositions } from './utils';
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
	updated_at: new Date().toISOString()
};

describe('buildTaskTree and subtaskProgress', () => {
	it('builds tree and counts progress', () => {
		const parent = { ...baseTask, id: '1', parent_id: null };
		const child1 = { ...baseTask, id: '2', parent_id: '1', status: 'done' as const };
		const child2 = { ...baseTask, id: '3', parent_id: '1', status: 'todo' as const };
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
		const t1 = { ...baseTask, id: '1', due_at: '2026-07-24T10:00:00Z' }; // today
		const t2 = { ...baseTask, id: '2', due_at: '2026-07-25T10:00:00Z' }; // upcoming
		const t3 = { ...baseTask, id: '3', due_at: null }; // no_date
		const tasks = [t1, t2, t3];
		expect(smartViewFilter(tasks, 'today', now).map(t => t.id)).toEqual(['1']);
		expect(smartViewFilter(tasks, 'upcoming', now).map(t => t.id)).toEqual(['2']);
		expect(smartViewFilter(tasks, 'no_date', now).map(t => t.id)).toEqual(['3']);
		expect(smartViewFilter(tasks, 'all', now)).toHaveLength(3);
	});
});

describe('labelUnion', () => {
	it('extracts unique sorted labels', () => {
		const t1 = { ...baseTask, id: '1', labels: ['b', 'a'] };
		const t2 = { ...baseTask, id: '2', labels: ['c', 'a'] };
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
