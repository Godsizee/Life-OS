// Welle 5.5 — „Tag in Zahlen": aggregiert den Tages-Snapshot aus allen Modulen.
// Wird über dem Journal-Freitext angezeigt und beim Speichern eingefroren.
import { tasksState } from '#lib/features/tasks/store.svelte.js';
import { habitsState } from '#lib/features/habits/store.svelte.js';
import { healthState } from '#lib/features/health/store.svelte.js';
import { moodState } from '#lib/features/mood/store.svelte.js';
import { fitnessState } from '#lib/features/fitness/store.svelte.js';
import { timeTrackingState } from '#lib/features/timetracking/store.svelte.js';
import { minutesOnDate } from '#lib/features/timetracking/stats.js';
import { isDueOn, isCompleted, isSkipped, type HabitCore } from '#lib/features/habits/streak.js';
import { toISODate } from '#lib/core/date.js';
import { waterMl } from '#lib/features/health/stats.js';
import type { DayContext } from './types';
import { istErledigt, istVerworfen } from '#lib/features/tasks/status.js';

export function buildDayContext(dateStr: string): DayContext {
	const date = new Date(dateStr);

	const todaysTasks = tasksState.tasks.filter((t) => {
		const isDue = t.due_at?.startsWith(dateStr);
		const isCompletedToday = !!t.completed_at && toISODate(new Date(t.completed_at)) === dateStr;
		return !istVerworfen(t) && (isDue || isCompletedToday);
	});
	const tasksDone = todaysTasks.filter(istErledigt).length;

	const active = habitsState.habits.filter((h) => !h.archived);
	const entryOf = (h: HabitCore & { id: string }, dStr: string) =>
		habitsState.entriesFor(h.id).find((d) => d.date === dStr);
	const dueHabits = active.filter(
		(h) => isDueOn(h.schedule, date) && !isSkipped(entryOf(h, dateStr))
	);
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
		mood_activities: moodEntry?.activities ?? [],
		sleep_h: healthEntry?.sleep_h ?? null,
		water_ml: healthEntry ? waterMl(healthEntry) : null,
		focus_minutes: minutesOnDate(timeTrackingState.entries, dateStr)
	};
}
