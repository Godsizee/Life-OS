import { z } from 'zod';

/** Manueller Nachtrag („Zeit nachtragen"). Datum als 'yyyy-mm-dd' (lokal). */
export const timeEntryInputSchema = z.object({
	minutes: z.number().int().min(1).max(1440),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	task_id: z.string().uuid().nullable().default(null),
	note: z.string().max(200).nullable().default(null)
});

export type TimeEntryInput = z.infer<typeof timeEntryInputSchema>;
