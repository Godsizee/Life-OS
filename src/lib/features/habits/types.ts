export type HabitSchedule =
	| { type: 'daily' }
	| { type: 'weekly'; days: number[] }
	/** W5: „times mal pro Woche, egal wann" (Streaks/Habitify-Muster). */
	| { type: 'weekly_count'; times: number };

export type HabitLogStatus = 'done' | 'skipped';

export interface Habit {
	id: string;
	workspace_id: string;
	name: string;
	schedule: HabitSchedule;
	color: string | null;
	archived: boolean;
	goal_id?: string | null;
	/** W5: null = Häkchen-Routine, > 1 = Mengen-Routine (erledigt ab value >= target). */
	target_value: number | null;
	/** W5: Anzeige-Einheit der Mengen-Routine, z. B. „Gläser". */
	unit: string | null;
	created_at: string;
	updated_at: string;
}

export interface HabitLog {
	id: string;
	workspace_id: string;
	habit_id: string;
	user_id: string;
	date: string;
	/** Erreichter Wert des Tages (Häkchen-Routine: 1). */
	value: number | null;
	/** W5: 'skipped' hält den Streak, zählt aber nicht als erledigt. */
	status: HabitLogStatus;
	created_at: string;
}
