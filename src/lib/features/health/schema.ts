import * as z from 'zod/mini';

const isoDate = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss yyyy-mm-dd sein'));

export const healthInputSchema = z.object({
	date: isoDate,
	weight_kg: z._default(z.nullable(z.number().check(z.positive(), z.maximum(500))), null),
	sleep_h: z._default(z.nullable(z.number().check(z.minimum(0), z.maximum(24))), null),
	// 0 ist ausdrücklich erlaubt (H-02). Obergrenze 15 l = physiologisches Maximum.
	water_ml: z._default(z.nullable(z.int().check(z.minimum(0), z.maximum(15000))), null),
	energy: z._default(z.nullable(z.int().check(z.minimum(1), z.maximum(5))), null)
});

export type HealthInput = z.infer<typeof healthInputSchema>;
