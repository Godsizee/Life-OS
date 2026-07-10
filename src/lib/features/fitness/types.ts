export interface WorkoutPlan {
	id: string;
	workspace_id: string;
	name: string;
	description: string | null;
	created_at: string;
	updated_at: string;
}

export interface WorkoutExercise {
	id: string;
	plan_id: string;
	name: string;
	category: string | null;
	default_sets: number;
	default_reps: number;
	default_weight: number | null;
	order_index: number;
}

export interface WorkoutLog {
	id: string;
	workspace_id: string;
	user_id: string;
	plan_id: string | null;
	date: string;
	duration_minutes: number | null;
	notes: string | null;
	created_at: string;
}

export interface WorkoutSetLog {
	id: string;
	log_id: string;
	exercise_name: string;
	set_index: number;
	reps: number;
	weight_kg: number | null;
	completed: boolean;
}

// Ein Datensatz pro Übung — das aktuell beste geschätzte 1RM (Welle 5.3).
export interface PersonalRecord {
	id: string;
	workspace_id: string;
	user_id: string;
	exercise_name: string;
	weight_kg: number;
	reps: number;
	est_1rm: number;
	achieved_at: string;
}
