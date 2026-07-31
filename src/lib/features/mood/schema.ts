import { z } from 'zod';

/** 'yyyy-mm-dd' — dieselbe Pruefung wie journal-stats.isValidEntryDate (W8). */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss yyyy-mm-dd sein');

/** Ein Aktivitaets-Tag: klein, ohne Leerzeichen, max. 24 Zeichen. */
export const activityIdSchema = z
	.string()
	.min(1)
	.max(24)
	.regex(/^[a-z0-9äöüß_-]+$/, 'Nur Kleinbuchstaben, Ziffern, _ und -');

export const moodInputSchema = z.object({
	date: isoDate,
	logged_at: z.string().optional(),
	score: z.number().int().min(1).max(5),
	note: z.string().max(2000).nullable().default(null),
	activities: z.array(activityIdSchema).max(30).default([])
});

export type MoodInput = z.infer<typeof moodInputSchema>;
