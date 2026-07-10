// Welle 5.5 — „Tag in Zahlen": aggregiert den Tages-Snapshot aus allen Modulen.
// Wird über dem Journal-Freitext angezeigt und beim Speichern eingefroren.
import { tasksState } from '$lib/features/tasks/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { healthState } from '$lib/features/health/store.svelte';
import { moodState } from '$lib/features/mood/store.svelte';
import { fitnessState } from '$lib/features/fitness/store.svelte';
import { focusState } from '$lib/features/focus/store.svelte';
import { isDueOn } from '$lib/features/habits/streak';
import { toISODate } from '$lib/core/date';
import type { DayContext } from './types';

export function buildDayContext(dateStr: string): DayContext {
	const date = new Date(dateStr);
	const isToday = dateStr === toISODate(new Date());

	const todaysTasks = tasksState.tasks.filter((t) => {
		const isDue = t.due_at?.startsWith(dateStr);
		const isCompletedToday = t.status === 'done' && t.updated_at?.startsWith(dateStr);
		return isDue || isCompletedToday;
	});
	const tasksDone = todaysTasks.filter((t) => t.status === 'done').length;

	const dueHabits = habitsState.habits.filter((h) => !h.archived && isDueOn(h.schedule, date));
	const habitsLogged = dueHabits.filter((h) => habitsState.logsFor(h.id).includes(dateStr)).length;

	const workout = fitnessState.logs.some((l) => l.date === dateStr);
	const moodEntry = moodState.entries.find((e) => e.date === dateStr);
	const healthEntry = healthState.entries.find((e) => e.date === dateStr);

	return {
		date: dateStr,
		tasks_done: tasksDone,
		tasks_total: todaysTasks.length,
		habits_logged: habitsLogged,
		habits_due: dueHabits.length,
		workout,
		mood: moodEntry?.score ?? null,
		sleep_h: healthEntry?.sleep_h ?? null,
		water_glasses: healthEntry?.water_glasses ?? null,
		focus_minutes: isToday ? focusState.completedPomodoros * 25 : 0
	};
}
