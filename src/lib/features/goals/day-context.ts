// Welle 5.5 — „Tag in Zahlen": aggregiert den Tages-Snapshot aus allen Modulen.
// Wird über dem Journal-Freitext angezeigt und beim Speichern eingefroren.
import { tasksState } from '$lib/features/tasks/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { healthState } from '$lib/features/health/store.svelte';
import { moodState } from '$lib/features/mood/store.svelte';
import { fitnessState } from '$lib/features/fitness/store.svelte';
import { timeTrackingState } from '$lib/features/timetracking/store.svelte';
import { minutesOnDate } from '$lib/features/timetracking/stats';
import { isDueOn, isCompleted, isSkipped, type HabitCore } from '$lib/features/habits/streak';
import { toISODate } from '$lib/core/date';
import type { DayContext } from './types';

export function buildDayContext(dateStr: string): DayContext {
	const date = new Date(dateStr);

	const todaysTasks = tasksState.tasks.filter((t) => {
		const isDue = t.due_at?.startsWith(dateStr);
		const isCompletedToday = t.status === 'done' && t.updated_at?.startsWith(dateStr);
		return isDue || isCompletedToday;
	});
	const tasksDone = todaysTasks.filter((t) => t.status === 'done').length;

	const active = habitsState.habits.filter((h) => !h.archived);
	const entryOf = (h: HabitCore & { id: string }, dStr: string) => habitsState.entriesFor(h.id).find((d) => d.date === dStr);
	const dueHabits = active.filter((h) => isDueOn(h.schedule, date) && !isSkipped(entryOf(h, dateStr)));
	const habitsLogged = dueHabits.filter((h) => isCompleted(h, entryOf(h, dateStr))).length;

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
		focus_minutes: minutesOnDate(timeTrackingState.entries, dateStr)
	};
}
