import { z } from 'zod';

export const healthInputSchema = z.object({
	date: z.string(),
	weight_kg: z.number().positive().nullable().default(null),
	sleep_h: z.number().min(0).max(24).nullable().default(null),
	water_glasses: z.number().int().min(0).max(20).nullable().default(null),
	energy: z.number().int().min(1).max(5).nullable().default(null)
});

export type HealthInput = z.infer<typeof healthInputSchema>;
