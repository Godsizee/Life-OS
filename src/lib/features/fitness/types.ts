export interface WorkoutPlan {
	id: string;
	workspace_id: string;
	name: string;
	description: string | null;
	created_at: string;
	updated_at: string;
}

export type ExerciseType = 'strength' | 'cardio' | 'duration';

// Baustein 1 (Welle F1) — globaler (workspace_id null) oder Custom-Übungskatalog.
export interface ExerciseCatalogEntry {
	id: string;
	workspace_id: string | null;
	name_de: string;
	name_en: string | null;
	exercise_type: ExerciseType;
	muscle_group: string | null;
	equipment: string | null;
	source: 'wger' | 'custom';
	external_id: string | null;
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
	exercise_id: string | null;
	exercise_type: ExerciseType;
	default_duration_min: number | null;
	default_distance_km: number | null;
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
	reps: number | null;
	weight_kg: number | null;
	completed: boolean;
	exercise_id: string | null;
	exercise_type: ExerciseType;
	duration_min: number | null;
	distance_km: number | null;
	rpe: number | null;
}

// Normalisierte Auswahl aus dem ExercisePicker — genug für Plan-/Log-Formulare,
// unabhängig davon ob die Quelle ein Katalog-Treffer, eine neue Custom-Übung
// oder ein unaufgelöster Alteintrag (exercise_id null) war.
export interface PickedExercise {
	exercise_id: string | null;
	name: string;
	exercise_type: ExerciseType;
}

// Welle F2 — ein Satz/eine Einheit im laufenden (noch ungespeicherten) Workout.
// Eigene `id` (statt Index) macht Sätze mitten im Grid einzeln entfernbar/erweiterbar.
export interface ActiveSetLog {
	id: string;
	exercise_name: string;
	exercise_id: string | null;
	exercise_type: ExerciseType;
	set_index: number;
	reps: number | null;
	weight_kg: number | null;
	duration_min: number | null;
	distance_km: number | null;
	rpe: number | null;
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
