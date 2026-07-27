import { z } from 'zod';

export const noteInputSchema = z.object({
	title: z.string().min(1).max(200),
	body: z.string().max(20000).default(''),
	tags: z.array(z.string().min(1).max(40)).max(20).default([]),
	private: z.boolean().default(false)
});

export type NoteInput = z.infer<typeof noteInputSchema>;

/** Teil-Update fuer das Detail-Sheet (alle Felder optional). */
export const notePatchSchema = noteInputSchema.partial();
export type NotePatch = z.infer<typeof notePatchSchema>;
