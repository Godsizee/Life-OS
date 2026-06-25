import { z } from 'zod';

export const noteInputSchema = z.object({
	title: z.string().min(1).max(200),
	body: z.string().max(20000).default(''),
	tags: z.array(z.string()).default([])
});

export type NoteInput = z.infer<typeof noteInputSchema>;
