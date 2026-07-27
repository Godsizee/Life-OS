export type GoalStatus = 'open' | 'in_progress' | 'done';
export type GoalType = 'standard' | 'pr' | 'fitness_frequency' | 'target';

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
	// Welle F4 — 'fitness_frequency' nutzt target_value als Trainings-Wochenziel.
	// W8 — 'target' nutzt target_value als Zielmenge und target_unit als Einheit.
	goal_type: GoalType;
	target_exercise: string | null;
	target_value: number | null;
	/** W8 — freie Einheit für Zielwert-Ziele („Bücher", „km", „€"). */
	target_unit: string | null;
	created_by: string;
	created_at: string;
	updated_at: string;
}

/** W8 — additiver Check-in auf ein Zielwert-Ziel. */
export interface GoalCheckin {
	id: string;
	workspace_id: string;
	goal_id: string;
	user_id: string;
	/** lokales Datum 'yyyy-mm-dd'. */
	date: string;
	/** numeric in Postgres — kann als String ankommen, immer über checkinValue() lesen. */
	value: number;
	note: string | null;
	created_at: string;
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
	/** W9 — Aktivitäten-Tags des Tages (Daylio). Optional: ältere Snapshots haben es nicht. */
	mood_activities?: string[];
	sleep_h: number | null;
	water_glasses: number | null;
	focus_minutes: number;
}

/** W8 — 'daily' = Tageseintrag (1/Tag), 'weekly' = Weekly-Review-Abschluss. */
export type JournalKind = 'daily' | 'weekly';

// Tagebuch ist persoenlich (RLS: owner-only), getrennt von den geteilten Zielen oben.
export interface JournalEntry {
	id: string;
	workspace_id: string;
	user_id: string;
	date: string;
	mood: string | null;
	body: string;
	context: DayContext | null;
	/** W8 — Eintragsart; entscheidet über den Unique-Key (user_id, date, kind). */
	kind: JournalKind;
	created_at: string;
	updated_at: string;
}
