import * as z from 'zod/mini';

export const taskInputSchema = z.object({
	title: z.string().check(z.minLength(1), z.maxLength(200)),
	priority: z._default(z.enum(['low', 'medium', 'high']), 'medium'),
	due_at: z._default(z.nullable(z.string()), null),
	project_id: z._default(z.nullable(z.uuid()), null),
	goal_id: z._default(z.nullable(z.uuid()), null),
	description: z._default(z.nullable(z.string().check(z.maxLength(20000))), null),
	parent_id: z._default(z.nullable(z.uuid()), null),
	labels: z._default(z.array(z.string()), []),
	rrule: z._default(z.nullable(z.string()), null),
	planned_for: z._default(z.nullable(z.iso.date()), null),
	estimate_min: z._default(z.nullable(z.int().check(z.minimum(1), z.maximum(1440))), null),
	scheduled_start: z._default(z.nullable(z.iso.datetime({ offset: true })), null)
});

export type TaskInput = z.infer<typeof taskInputSchema>;

export const projectInputSchema = z.object({
	name: z.string().check(z.minLength(1), z.maxLength(100)),
	color: z._default(z.nullable(z.string()), null)
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
