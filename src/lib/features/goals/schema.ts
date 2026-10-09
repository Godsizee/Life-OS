import * as z from 'zod/mini';

const isoTag = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/));

export const goalInputSchema = z.object({
	title: z.string().check(z.minLength(1), z.maxLength(200)),
	description: z._default(z.string().check(z.maxLength(2000)), ''),
	target_date: z._default(z.nullable(z.string()), null),
	parent_id: z._default(z.nullable(z.uuid()), null),
	goal_type: z._default(z.enum(['standard', 'pr', 'fitness_frequency', 'target']), 'standard'),
	target_exercise: z._default(z.nullable(z.string().check(z.maxLength(100))), null),
	target_value: z._default(z.nullable(z.number().check(z.positive())), null),
	// W8 — Einheit für Zielwert-Ziele; bewusst kurz, sie steht direkt hinter der Zahl.
	target_unit: z._default(z.nullable(z.string().check(z.maxLength(20))), null),
	archived: z._default(z.boolean(), false)
});

export type GoalInput = z.infer<typeof goalInputSchema>;

/** W8 — Check-in. Werte sind additiv und immer positiv (Korrektur = löschen). */
export const goalCheckinInputSchema = z.object({
	goal_id: z.uuid(),
	date: isoTag,
	value: z.number().check(z.positive(), z.maximum(1_000_000)),
	note: z._default(z.nullable(z.string().check(z.maxLength(200))), null)
});

export type GoalCheckinInput = z.infer<typeof goalCheckinInputSchema>;

export const journalEntryInputSchema = z.object({
	// W8 — Regex ist der Schutz gegen ungültige Daten in der Outbox (siehe Plan §5/10).
	date: isoTag,
	mood: z._default(z.nullable(z.string().check(z.maxLength(20))), null),
	body: z._default(z.string().check(z.maxLength(20000)), ''),
	kind: z._default(z.enum(['daily', 'weekly']), 'daily')
});

export type JournalEntryInput = z.infer<typeof journalEntryInputSchema>;
