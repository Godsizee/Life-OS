import * as z from 'zod/mini';

export const exerciseTypeSchema = z.enum(['strength', 'cardio', 'duration']);

export const workoutPlanInputSchema = z.object({
	name: z.string().check(z.minLength(1), z.maxLength(100)),
	description: z._default(z.nullable(z.string()), null)
});

export const workoutExerciseInputSchema = z.object({
	name: z.string().check(z.minLength(1), z.maxLength(100)),
	category: z._default(z.nullable(z.string()), null),
	default_sets: z._default(z.int().check(z.minimum(1)), 3),
	default_reps: z._default(z.int().check(z.minimum(1)), 10),
	default_weight: z._default(z.nullable(z.number()), null),
	order_index: z._default(z.int(), 0),
	exercise_id: z._default(z.nullable(z.string()), null),
	exercise_type: z._default(exerciseTypeSchema, 'strength'),
	default_duration_min: z._default(z.nullable(z.number()), null),
	default_distance_km: z._default(z.nullable(z.number()), null)
});

// Baustein 1 (Welle F1) — „Eigene Übung anlegen"-Fallback im ExercisePicker.
export const customExerciseInputSchema = z.object({
	name_de: z.string().check(z.minLength(1), z.maxLength(100)),
	name_en: z._default(z.nullable(z.string().check(z.maxLength(100))), null),
	exercise_type: z._default(exerciseTypeSchema, 'strength'),
	muscle_group: z._default(z.nullable(z.string()), null),
	equipment: z._default(z.nullable(z.string()), null)
});

export type WorkoutPlanInput = z.infer<typeof workoutPlanInputSchema>;
export type WorkoutExerciseInput = z.infer<typeof workoutExerciseInputSchema>;
export type CustomExerciseInput = z.infer<typeof customExerciseInputSchema>;
