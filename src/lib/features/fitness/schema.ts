import { z } from 'zod';

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
	order_index: z.number().int().default(0)
});

export type WorkoutPlanInput = z.infer<typeof workoutPlanInputSchema>;
export type WorkoutExerciseInput = z.infer<typeof workoutExerciseInputSchema>;
