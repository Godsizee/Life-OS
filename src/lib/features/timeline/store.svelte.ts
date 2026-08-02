import { tasksState } from '$lib/features/tasks/store.svelte';
import { habitsState } from '$lib/features/habits/store.svelte';
import { moodState } from '$lib/features/mood/store.svelte';
import { goalsState } from '$lib/features/goals/store.svelte';
import { healthState } from '$lib/features/health/store.svelte';
import { notesState } from '$lib/features/notes/store.svelte';
import { fitnessState } from '$lib/features/fitness/store.svelte';
import { calendarState } from '$lib/features/calendar/store.svelte';
import { timeTrackingState } from '$lib/features/timetracking/store.svelte';

import { buildTimeline } from './build';
import type { TimelineFenster, TimelineItem } from './types';
import { toISODate } from '$lib/core/date';

class TimelineState {
	range = $state<30 | 90 | 365 | 'all'>(90);

	constructor() {
		// client-side only
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('lifeos:timeline-range');
			if (saved === 'all' || saved === '30' || saved === '90' || saved === '365') {
				this.range = saved === 'all' ? 'all' : (parseInt(saved, 10) as any);
			}
		}
	}

	setRange(r: typeof this.range) {
		this.range = r;
		if (typeof window !== 'undefined') {
			localStorage.setItem('lifeos:timeline-range', String(r));
		}
	}

	fenster = $derived.by((): TimelineFenster => {
		const bis = new Date();
		let von = new Date();
		if (this.range === 'all') {
			von = new Date(2000, 0, 1); // Weit in der Vergangenheit — deckt jede realistische Historie ab
		} else {
			von.setDate(von.getDate() - this.range);
		}
		return {
			von: toISODate(von),
			bis: toISODate(bis)
		};
	});

	items = $derived.by((): TimelineItem[] => {
		return buildTimeline(
			{
				tasks: tasksState.tasks,
				habitLogs: habitsState.logs,
				habits: habitsState.habits,
				moods: moodState.entries,
				goals: goalsState.goals,
				health: healthState.entries,
				notes: notesState.notes,
				workouts: fitnessState.logs,
				plans: fitnessState.plans,
				events: calendarState.events,
				overrides: calendarState.overrides,
				timeEntries: timeTrackingState.entries,
				checkins: goalsState.checkins,
				journal: goalsState.journalEntries
			},
			this.fenster
		);
	});
}

export const timelineState = new TimelineState();
