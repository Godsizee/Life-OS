// Welle 5.1 — Auflösung von Entitäten für Universal-Links.
// Liest die bereits geladenen Feature-Stores; keine eigene Persistenz.
import { tasksState } from '$lib/features/tasks/store.svelte';
import { notesState } from '$lib/features/notes/store.svelte';
import { calendarState } from '$lib/features/calendar/store.svelte';
import { goalsState } from '$lib/features/goals/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { fitnessState } from '$lib/features/fitness/store.svelte';
import { CheckSquare, Notebook, Calendar, Target, Repeat, Dumbbell, type Icon } from 'lucide-svelte';
import type { LinkEntityType, LinkableEntity } from './types';

interface EntityMeta {
	label: string;
	icon: typeof Icon;
	route: (id: string) => string;
}

export const entityMeta: Record<LinkEntityType, EntityMeta> = {
	task: { label: 'Aufgabe', icon: CheckSquare, route: () => '/tasks' },
	note: { label: 'Notiz', icon: Notebook, route: () => '/notes' },
	event: { label: 'Termin', icon: Calendar, route: () => '/calendar' },
	goal: { label: 'Ziel', icon: Target, route: (id) => `/goals/${id}` },
	habit: { label: 'Routine', icon: Repeat, route: () => '/habits' },
	workout_plan: { label: 'Trainingsplan', icon: Dumbbell, route: () => '/fitness' }
};

function allEntities(): LinkableEntity[] {
	return [
		...tasksState.tasks.map((t) => ({ type: 'task' as const, id: t.id, title: t.title })),
		...notesState.notes.map((n) => ({ type: 'note' as const, id: n.id, title: n.title })),
		...calendarState.events.map((e) => ({ type: 'event' as const, id: e.id, title: e.title })),
		...goalsState.goals.map((g) => ({ type: 'goal' as const, id: g.id, title: g.title })),
		...habitsState.habits
			.filter((h) => !h.archived)
			.map((h) => ({ type: 'habit' as const, id: h.id, title: h.name })),
		...fitnessState.plans.map((p) => ({ type: 'workout_plan' as const, id: p.id, title: p.name }))
	];
}

export function resolveEntity(type: LinkEntityType, id: string): LinkableEntity | null {
	return allEntities().find((e) => e.type === type && e.id === id) ?? null;
}

export function searchEntities(
	query: string,
	exclude?: { type: LinkEntityType; id: string }
): LinkableEntity[] {
	const q = query.trim().toLowerCase();
	return allEntities()
		.filter((e) => !(exclude && e.type === exclude.type && e.id === exclude.id))
		.filter((e) => !q || e.title.toLowerCase().includes(q))
		.slice(0, 8);
}
