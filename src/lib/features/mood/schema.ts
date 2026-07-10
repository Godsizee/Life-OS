import { z } from 'zod';

export const moodInputSchema = z.object({
	date: z.string(),
	score: z.number().int().min(1).max(5),
	note: z.string().nullable().default(null)
});

export type MoodInput = z.infer<typeof moodInputSchema>;
