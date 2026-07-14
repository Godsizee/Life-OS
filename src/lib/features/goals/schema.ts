import { z } from 'zod';

export const goalInputSchema = z.object({
	title: z.string().min(1).max(200),
	description: z.string().max(2000).default(''),
	target_date: z.string().nullable().default(null),
	parent_id: z.string().uuid().nullable().default(null),
	goal_type: z.enum(['standard', 'pr', 'fitness_frequency']).default('standard'),
	target_exercise: z.string().max(100).nullable().default(null),
	target_value: z.number().positive().nullable().default(null)
});

export type GoalInput = z.infer<typeof goalInputSchema>;

export const journalEntryInputSchema = z.object({
	date: z.string(),
	mood: z.string().nullable().default(null),
	body: z.string().max(20000).default('')
});

export type JournalEntryInput = z.infer<typeof journalEntryInputSchema>;
