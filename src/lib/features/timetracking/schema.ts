import * as z from 'zod/mini';

/** Manueller Nachtrag („Zeit nachtragen"). Datum als 'yyyy-mm-dd' (lokal). */
export const timeEntryInputSchema = z.object({
	minutes: z.int().check(z.minimum(1), z.maximum(1440)),
	date: z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/)),
	task_id: z._default(z.nullable(z.uuid()), null),
	note: z._default(z.nullable(z.string().check(z.maxLength(200))), null)
});

export type TimeEntryInput = z.infer<typeof timeEntryInputSchema>;
