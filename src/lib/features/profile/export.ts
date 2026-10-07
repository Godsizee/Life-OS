import { toISODate } from '#lib/core/date.js';
import { profileState } from './store.svelte';
import { tasksState } from '#lib/features/tasks/store.svelte.js';
import { notesState } from '#lib/features/notes/store.svelte.js';
import { habitsState } from '#lib/features/habits/store.svelte.js';
import { calendarState } from '#lib/features/calendar/store.svelte.js';
import { shoppingState } from '#lib/features/shopping/store.svelte.js';
import { goalsState } from '#lib/features/goals/store.svelte.js';
import { linksState } from '#lib/features/links/store.svelte.js';
import { remindersState } from '#lib/features/reminders/store.svelte.js';
import { attachmentsState } from '#lib/features/attachments/store.svelte.js';
import { healthState } from '#lib/features/health/store.svelte.js';
import { moodState } from '#lib/features/mood/store.svelte.js';
import { timeTrackingState } from '#lib/features/timetracking/store.svelte.js';

/**
 * Sammelt alle bereits geladenen Stores zu einem JSON-Dokument.
 * Bewusst ohne eigene Queries: system/daten.ts hat alles schon im Speicher.
 */
export function buildExport(): string {
	const data = {
		export_date: new Date().toISOString(),
		profile: {
			display_name: profileState.displayName,
			settings: profileState.settings
		},
		workspace: {
			tasks: tasksState.tasks,
			projects: tasksState.projects,
			notes: notesState.notes,
			habits: habitsState.habits,
			habit_logs: habitsState.logs,
			calendar_events: calendarState.events,
			shopping_items: shoppingState.items,
			goals: goalsState.goals,
			// fitnessLogs are loaded on demand, might not be fully present, but we export what's in memory
			links: linksState.links,
			reminders: remindersState.reminders,
			attachments: attachmentsState.items,
			health_entries: healthState.entries,
			mood_entries: moodState.entries,
			time_sessions: timeTrackingState.entries
		}
	};

	return JSON.stringify(data, null, 2);
}

export function downloadExport(): void {
	const blob = new Blob([buildExport()], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `life-os-export-${toISODate(new Date())}.json`;
	a.click();
	URL.revokeObjectURL(url);
}
