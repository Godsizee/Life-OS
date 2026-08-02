import type { Task, TaskStatus } from './types';
import { toISODate } from '$lib/core/date';
import { weekKey } from '$lib/features/analytics/week-window';

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

/** Wurde die Aufgabe an diesem lokalen Kalendertag erledigt? */
export function completedOn(task: Pick<Task, 'status' | 'completed_at'>, dateStr: string): boolean {
	if (task.status !== 'done' || !task.completed_at) return false;
	return toISODate(new Date(task.completed_at)) === dateStr;
}

/** Alle Aufgaben, die im Zeitraum [von, bis] erledigt wurden (lokale Kalendertage). */
export function completedBetween(tasks: Task[], von: string, bis: string): Task[] {
	return tasks.filter((t) => {
		if (t.status !== 'done' || !t.completed_at) return false;
		const d = toISODate(new Date(t.completed_at));
		return d >= von && d <= bis;
	});
}

export type SmartView = 'all' | 'today' | 'overdue' | 'upcoming' | 'no_date' | 'focus_week';

export function smartViewFilter(tasks: Task[], view: SmartView, now: Date = new Date()): Task[] {
	if (view === 'all') return tasks;
	if (view === 'focus_week') {
		const key = weekKey(now);
		return tasks.filter((t) => t.focus_week === key);
	}
	const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
	const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
	const in7 = new Date(endOfToday); in7.setDate(in7.getDate() + 7);

	return tasks.filter((t) => {
		if (view === 'no_date') return t.due_at === null;
		if (!t.due_at) return false;
		const due = new Date(t.due_at);
		// Erledigtes ist nie überfällig.
		if (view === 'overdue') return t.status !== 'done' && due < startOfToday;
		// "Heute" zeigt ab jetzt NUR den heutigen Tag — Überfälliges hat eine eigene Ansicht.
		if (view === 'today') return due >= startOfToday && due <= endOfToday;
		return due > endOfToday && due <= in7;
	});
}

export function overdueCount(tasks: Task[], now: Date = new Date()): number {
	return smartViewFilter(tasks, 'overdue', now).length;
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

/** Volltextfilter über Titel, Beschreibung und Labels (Muster: notes/filter.ts:filterNotes). */
export function filterTasks(tasks: Task[], query: string): Task[] {
	const q = query.trim().toLowerCase();
	if (!q) return tasks;
	return tasks.filter(
		(t) =>
			t.title.toLowerCase().includes(q) ||
			(t.description ?? '').toLowerCase().includes(q) ||
			(t.labels ?? []).some((l) => l.toLowerCase().includes(q))
	);
}
