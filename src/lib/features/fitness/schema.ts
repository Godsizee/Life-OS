import { z } from 'zod';

export const exerciseTypeSchema = z.enum(['strength', 'cardio', 'duration']);

export const workoutPlanInputSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().nullable().default(null)
});

export const workoutExerciseInputSchema = z.object({
	name: z.string().min(1).max(100),
	category: z.string().nullable().default(null),
	default_sets: z.number().int().min(1).default(3),
	default_reps: z.number().int().min(1).default(10),
	default_weight: z.number().nullable().default(null),
	order_index: z.number().int().default(0),
	exercise_id: z.string().nullable().default(null),
	exercise_type: exerciseTypeSchema.default('strength'),
	default_duration_min: z.number().nullable().default(null),
	default_distance_km: z.number().nullable().default(null)
});

// Baustein 1 (Welle F1) — „Eigene Übung anlegen"-Fallback im ExercisePicker.
export const customExerciseInputSchema = z.object({
	name_de: z.string().min(1).max(100),
	name_en: z.string().max(100).nullable().default(null),
	exercise_type: exerciseTypeSchema.default('strength'),
	muscle_group: z.string().nullable().default(null),
	equipment: z.string().nullable().default(null)
});

export type WorkoutPlanInput = z.infer<typeof workoutPlanInputSchema>;
export type WorkoutExerciseInput = z.infer<typeof workoutExerciseInputSchema>;
export type CustomExerciseInput = z.infer<typeof customExerciseInputSchema>;
