import * as z from 'zod/mini';

/** 'yyyy-mm-dd' — dieselbe Pruefung wie journal-stats.isValidEntryDate (W8). */
const isoDate = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum muss yyyy-mm-dd sein'));

/** Ein Aktivitaets-Tag: klein, ohne Leerzeichen, max. 24 Zeichen. */
export const activityIdSchema = z
	.string()
	.check(
		z.minLength(1),
		z.maxLength(24),
		z.regex(/^[a-z0-9äöüß_-]+$/, 'Nur Kleinbuchstaben, Ziffern, _ und -')
	);

export const moodInputSchema = z.object({
	date: isoDate,
	logged_at: z.optional(z.string()),
	score: z.int().check(z.minimum(1), z.maximum(5)),
	note: z._default(z.nullable(z.string().check(z.maxLength(2000))), null),
	activities: z._default(z.array(activityIdSchema).check(z.maxLength(30)), [])
});

export type MoodInput = z.infer<typeof moodInputSchema>;
