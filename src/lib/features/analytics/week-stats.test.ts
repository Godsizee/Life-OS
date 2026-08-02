import { describe, expect, it } from 'vitest';
import { wochenKennzahlen, type WochenQuellen } from './week-stats';
import { reviewWeek } from './week-window';
import type { Task } from '$lib/features/tasks/types';
import type { Habit } from '$lib/features/habits/types';
import type { HabitDay } from '$lib/features/habits/streak';
import type { DatedSetLog } from '$lib/features/fitness/api';

function tag(iso: string): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(y, m - 1, d);
}

const aktuell = reviewWeek(tag('2026-07-29')); // Mi, Fenster 2026-07-23..29
const vorwoche = reviewWeek(tag('2026-07-22')); // Mi, Fenster 2026-07-16..22

function mkTask(overrides: Partial<Task>): Task {
	return {
		id: 'id-' + Math.random(),
		workspace_id: 'ws',
		project_id: null,
		goal_id: null,
		parent_id: null,
		title: 'Task',
		description: null,
		labels: [],
		status: 'done',
		priority: 'medium',
		due_at: null,
		assignee_id: null,
		rrule: null,
		position: 0,
		created_by: 'user',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		completed_at: null,
		focus_week: null,
		...overrides
	} as Task;
}

function leereQuellen(overrides: Partial<WochenQuellen> = {}): WochenQuellen {
	return {
		tasks: [],
		habits: [],
		habitDays: () => [],
		workouts: [],
		setLogs: [],
		moods: [],
		health: [],
		focusEntries: [],
		waterGoalMl: 2000,
		lifeScores: [],
		...overrides
	};
}

describe('wochenKennzahlen — Aufgaben', () => {
	it('zählt nur erledigte Aufgaben mit completed_at im Fenster', () => {
		const q = leereQuellen({
			tasks: [
				mkTask({ completed_at: '2026-07-24T10:00:00' }), // im Fenster
				mkTask({ completed_at: '2026-07-10T10:00:00' }), // vor dem Fenster
				mkTask({ status: 'todo', completed_at: null }) // offen
			]
		});
		const k = wochenKennzahlen(q, aktuell, vorwoche).find((x) => x.id === 'tasks')!;
		expect(k.wert).toBe(1);
	});
});

describe('wochenKennzahlen — Routinen-Adhärenz', () => {
	it('ignoriert übersprungene Tage im Nenner', () => {
		const habit: Habit = {
			id: 'h1',
			workspace_id: 'ws',
			name: 'Lesen',
			schedule: { type: 'daily' },
			color: null,
			archived: false,
			target_value: null,
			unit: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		// Fenster hat 7 Tage; einer übersprungen, drei erledigt -> 3/6.
		const days: HabitDay[] = [
			{ date: '2026-07-23', value: 1, status: 'done' },
			{ date: '2026-07-24', value: 1, status: 'done' },
			{ date: '2026-07-25', value: 1, status: 'done' },
			{ date: '2026-07-26', value: null, status: 'skipped' }
		];
		const q = leereQuellen({ habits: [habit], habitDays: () => days });
		const k = wochenKennzahlen(q, aktuell, vorwoche).find((x) => x.id === 'habits')!;
		expect(k.wert).toBe(Math.round((3 / 6) * 100));
	});
});

describe('wochenKennzahlen — Trainingsvolumen', () => {
	it('zählt keine Aufwärmsätze', () => {
		const setLogs: DatedSetLog[] = [
			{
				id: 's1',
				log_id: 'l1',
				exercise_name: 'Kniebeuge',
				set_index: 0,
				reps: 5,
				weight_kg: 100,
				completed: true,
				exercise_id: null,
				exercise_type: 'strength',
				duration_min: null,
				distance_km: null,
				rpe: null,
				set_type: 'normal',
				date: '2026-07-24'
			},
			{
				id: 's2',
				log_id: 'l1',
				exercise_name: 'Kniebeuge',
				set_index: -1,
				reps: 5,
				weight_kg: 40,
				completed: true,
				exercise_id: null,
				exercise_type: 'strength',
				duration_min: null,
				distance_km: null,
				rpe: null,
				set_type: 'warmup',
				date: '2026-07-24'
			}
		];
		const q = leereQuellen({ setLogs });
		const k = wochenKennzahlen(q, aktuell, vorwoche).find((x) => x.id === 'volume')!;
		expect(k.wert).toBe(500); // nur der normale Satz: 100 * 5
	});
});

describe('wochenKennzahlen — fehlende Vorwochendaten', () => {
	it('liefert vorwoche = null statt einer irreführenden 0', () => {
		const q = leereQuellen({ moods: [{ date: '2026-07-24', score: 4 }] });
		const k = wochenKennzahlen(q, aktuell, vorwoche).find((x) => x.id === 'mood')!;
		expect(k.wert).toBeCloseTo(4);
		expect(k.vorwoche).toBeNull();
	});
});
