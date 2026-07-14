export type GoalStatus = 'open' | 'in_progress' | 'done';
export type GoalType = 'standard' | 'pr' | 'fitness_frequency';

export interface Goal {
	id: string;
	workspace_id: string;
	parent_id: string | null;
	title: string;
	description: string;
	target_date: string | null;
	progress: number;
	status: GoalStatus;
	// Welle 5.2 — PR-Ziele koppeln an eine Fitness-Übung (target_value = Ziel-1RM in kg).
	// Welle F4 — 'fitness_frequency' nutzt target_value als Trainings-Wochenziel (target_exercise bleibt null).
	goal_type: GoalType;
	target_exercise: string | null;
	target_value: number | null;
	created_by: string;
	created_at: string;
	updated_at: string;
}

// Welle 5.5 — eingefrorener Tages-Snapshot, der am Journal-Eintrag hängt.
export interface DayContext {
	date: string;
	tasks_done: number;
	tasks_total: number;
	habits_logged: number;
	habits_due: number;
	workout: boolean;
	mood: number | null;
	sleep_h: number | null;
	water_glasses: number | null;
	focus_minutes: number;
}

// Tagebuch ist persoenlich (RLS: owner-only), getrennt von den geteilten Zielen oben.
export interface JournalEntry {
	id: string;
	workspace_id: string;
	user_id: string;
	date: string;
	mood: string | null;
	body: string;
	context: DayContext | null;
	created_at: string;
	updated_at: string;
}
