import type { Task, TaskStatus } from './types';

export interface TaskNode { task: Task; children: Task[]; }

const byPosition = (a: Task, b: Task) =>
	a.position - b.position || a.created_at.localeCompare(b.created_at);

/** 1-Ebenen-Baum: Top-Level-Aufgaben in gegebener Reihenfolge, je mit ihren Kindern. */
export function buildTaskTree(tasks: Task[]): TaskNode[] {
	const byParent = new Map<string, Task[]>();
	for (const t of tasks) {
		if (t.parent_id) {
			const arr = byParent.get(t.parent_id) ?? [];
			arr.push(t);
			byParent.set(t.parent_id, arr);
		}
	}
	return tasks
		.filter((t) => !t.parent_id)
		.map((task) => ({ task, children: (byParent.get(task.id) ?? []).sort(byPosition) }));
}

export function subtaskProgress(children: Task[]): { done: number; total: number } {
	return { done: children.filter((c) => c.status === 'done').length, total: children.length };
}

export type SmartView = 'all' | 'today' | 'upcoming' | 'no_date';

export function smartViewFilter(tasks: Task[], view: SmartView, now: Date = new Date()): Task[] {
	if (view === 'all') return tasks;
	const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
	const in7 = new Date(endOfToday); in7.setDate(in7.getDate() + 7);
	return tasks.filter((t) => {
		if (view === 'no_date') return t.due_at === null;
		if (!t.due_at) return false;
		const due = new Date(t.due_at);
		if (view === 'today') return due <= endOfToday;
		return due > endOfToday && due <= in7;
	});
}

export function labelUnion(tasks: Task[]): string[] {
	const set = new Set<string>();
	for (const t of tasks) for (const l of t.labels ?? []) set.add(l);
	return [...set].sort((a, b) => a.localeCompare(b));
}

/** Weist den Karten einer Spalte fortlaufende Positionen 0..n zu (in gegebener Reihenfolge). */
export function assignColumnPositions(orderedIds: string[]): { id: string; position: number }[] {
	return orderedIds.map((id, i) => ({ id, position: i }));
}
