import { z } from 'zod';

export const taskInputSchema = z.object({
	title: z.string().min(1).max(200),
	priority: z.enum(['low', 'medium', 'high']).default('medium'),
	due_at: z.string().nullable().default(null),
	project_id: z.string().uuid().nullable().default(null),
	goal_id: z.string().uuid().nullable().default(null),
	description: z.string().max(20000).nullable().default(null),
	parent_id: z.string().uuid().nullable().default(null),
	labels: z.array(z.string()).default([]),
	rrule: z.string().nullable().default(null),
	planned_for: z.iso.date().nullable().default(null),
	estimate_min: z.int().min(1).max(1440).nullable().default(null),
	scheduled_start: z.iso.datetime({ offset: true }).nullable().default(null)
});

export type TaskInput = z.infer<typeof taskInputSchema>;

export const projectInputSchema = z.object({
	name: z.string().min(1).max(100),
	color: z.string().nullable().default(null)
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
