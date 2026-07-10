import { z } from 'zod';

export const habitScheduleSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('daily') }),
	z.object({ type: z.literal('weekly'), days: z.array(z.number().min(0).max(6)).min(1) })
]);

export const habitInputSchema = z.object({
	name: z.string().min(1).max(100),
	schedule: habitScheduleSchema.default({ type: 'daily' }),
	color: z.string().nullable().default(null),
	goal_id: z.string().uuid().nullable().optional()
});

export type HabitInput = z.infer<typeof habitInputSchema>;
