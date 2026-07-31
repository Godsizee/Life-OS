import { z } from 'zod';

export const goalInputSchema = z.object({
	title: z.string().min(1).max(200),
	description: z.string().max(2000).default(''),
	target_date: z.string().nullable().default(null),
	parent_id: z.string().uuid().nullable().default(null),
	goal_type: z.enum(['standard', 'pr', 'fitness_frequency', 'target']).default('standard'),
	target_exercise: z.string().max(100).nullable().default(null),
	target_value: z.number().positive().nullable().default(null),
	// W8 — Einheit für Zielwert-Ziele; bewusst kurz, sie steht direkt hinter der Zahl.
	target_unit: z.string().max(20).nullable().default(null),
	archived: z.boolean().default(false)
});

export type GoalInput = z.infer<typeof goalInputSchema>;

/** W8 — Check-in. Werte sind additiv und immer positiv (Korrektur = löschen). */
export const goalCheckinInputSchema = z.object({
	goal_id: z.string().uuid(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	value: z.number().positive().max(1_000_000),
	note: z.string().max(200).nullable().default(null)
});

export type GoalCheckinInput = z.infer<typeof goalCheckinInputSchema>;

export const journalEntryInputSchema = z.object({
	// W8 — Regex ist der Schutz gegen ungültige Daten in der Outbox (siehe Plan §5/10).
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	mood: z.string().max(20).nullable().default(null),
	body: z.string().max(20000).default(''),
	kind: z.enum(['daily', 'weekly']).default('daily')
});

export type JournalEntryInput = z.infer<typeof journalEntryInputSchema>;
