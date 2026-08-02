import type { TimelineModule } from './module-ids';
import type { Task } from '$lib/features/tasks/types';
import type { HabitLog, Habit } from '$lib/features/habits/types';
import type { MoodEntry } from '$lib/features/mood/types';
import type { Goal, GoalCheckin, JournalEntry } from '$lib/features/goals/types';
import type { HealthEntry } from '$lib/features/health/types';
import type { Note } from '$lib/features/notes/types';
import type { WorkoutLog, WorkoutPlan } from '$lib/features/fitness/types';
import type { Event, EventOverride } from '$lib/features/calendar/types';
import type { TimeEntryLike } from '$lib/features/timetracking/stats';

export interface TimelineItem {
	id: string;
	date: string;
	title: string;
	description?: string;
	module: TimelineModule;
}

export interface TimelineGroup {
	date: string;
	items: TimelineItem[];
}

export interface TimelineQuellen {
	tasks: Task[];
	habitLogs: HabitLog[];
	habits: Habit[];
	moods: MoodEntry[];
	goals: Goal[];
	health: HealthEntry[];
	notes: Note[];
	workouts: WorkoutLog[];
	plans: WorkoutPlan[];
	events: Event[];
	overrides: EventOverride[];
	timeEntries: TimeEntryLike[];
	checkins: GoalCheckin[];
	journal: JournalEntry[];
}

export interface TimelineFenster {
	/** yyyy-mm-dd, inklusiv. */
	von: string;
	bis: string;
}
