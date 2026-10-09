import * as z from 'zod/mini';

export const noteInputSchema = z.object({
	title: z.string().check(z.minLength(1), z.maxLength(200)),
	body: z._default(z.string().check(z.maxLength(20000)), ''),
	tags: z._default(
		z.array(z.string().check(z.minLength(1), z.maxLength(40))).check(z.maxLength(20)),
		[]
	),
	private: z._default(z.boolean(), false)
});

export type NoteInput = z.infer<typeof noteInputSchema>;

/** Teil-Update fuer das Detail-Sheet (alle Felder optional). */
export const notePatchSchema = z.partial(noteInputSchema);
export type NotePatch = z.infer<typeof notePatchSchema>;
