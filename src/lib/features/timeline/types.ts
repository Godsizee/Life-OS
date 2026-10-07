import type { TimelineModule } from './module-ids';
import type { Task } from '#lib/features/tasks/types.js';
import type { HabitLog, Habit } from '#lib/features/habits/types.js';
import type { MoodEntry } from '#lib/features/mood/types.js';
import type { Goal, GoalCheckin, JournalEntry } from '#lib/features/goals/types.js';
import type { HealthEntry } from '#lib/features/health/types.js';
import type { Note } from '#lib/features/notes/types.js';
import type { WorkoutLog, WorkoutPlan } from '#lib/features/fitness/types.js';
import type { Event, EventOverride } from '#lib/features/calendar/types.js';
import type { TimeEntryLike } from '#lib/features/timetracking/stats.js';

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
