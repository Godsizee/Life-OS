import type { ModulManifest } from '#lib/core/modul.js';
import { analyticsModul } from '#lib/features/analytics/modul.js';
import { calendarModul } from '#lib/features/calendar/modul.js';
import { dashboardModul } from '#lib/features/dashboard/modul.js';
import { fitnessModul } from '#lib/features/fitness/modul.js';
import { focusModul } from '#lib/features/focus/modul.js';
import { goalsModul } from '#lib/features/goals/modul.js';
import { journalModul } from '#lib/features/goals/journal-modul.js';
import { habitsModul } from '#lib/features/habits/modul.js';
import { healthModul } from '#lib/features/health/modul.js';
import { moodModul } from '#lib/features/mood/modul.js';
import { notesModul } from '#lib/features/notes/modul.js';
import { reviewModul } from '#lib/features/review/modul.js';
import { shoppingModul } from '#lib/features/shopping/modul.js';
import { tasksModul } from '#lib/features/tasks/modul.js';
import { timelineModul } from '#lib/features/timeline/modul.js';

/** Alle Fähigkeiten-Manifeste, Reihenfolge wie die Registry in config/modules.ts. */
export const MODULE: ModulManifest[] = [
	dashboardModul,
	tasksModul,
	notesModul,
	habitsModul,
	calendarModul,
	shoppingModul,
	goalsModul,
	journalModul,
	focusModul,
	reviewModul,
	moodModul,
	healthModul,
	fitnessModul,
	analyticsModul,
	timelineModul
];
