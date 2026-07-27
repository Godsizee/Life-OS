import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss yyyy-mm-dd sein');

export const healthInputSchema = z.object({
	date: isoDate,
	weight_kg: z.number().positive().max(500).nullable().default(null),
	sleep_h: z.number().min(0).max(24).nullable().default(null),
	water_glasses: z.number().int().min(0).max(30).nullable().default(null),
	energy: z.number().int().min(1).max(5).nullable().default(null)
});

export type HealthInput = z.infer<typeof healthInputSchema>;
