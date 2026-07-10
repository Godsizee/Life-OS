export type HabitSchedule = { type: 'daily' } | { type: 'weekly'; days: number[] };

export interface Habit {
	id: string;
	workspace_id: string;
	name: string;
	schedule: HabitSchedule;
	color: string | null;
	archived: boolean;
	goal_id?: string | null;
	created_at: string;
	updated_at: string;
}

export interface HabitLog {
	id: string;
	workspace_id: string;
	habit_id: string;
	user_id: string;
	date: string;
	value: number | null;
	created_at: string;
}
