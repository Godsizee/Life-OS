import { z } from 'zod';

export const habitScheduleSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('daily') }),
	z.object({ type: z.literal('weekly'), days: z.array(z.number().int().min(0).max(6)).min(1) }),
	z.object({ type: z.literal('weekly_count'), times: z.number().int().min(1).max(7) })
]);

export const habitInputSchema = z.object({
	name: z.string().min(1).max(100),
	schedule: habitScheduleSchema.default({ type: 'daily' }),
	color: z.string().nullable().default(null),
	/** null = Häkchen-Routine. Werte <= 1 werden wie null behandelt. */
	target_value: z.number().positive().max(10000).nullable().default(null),
	unit: z.string().max(20).nullable().default(null),
	goal_id: z.string().uuid().nullable().optional()
});

export type HabitInput = z.infer<typeof habitInputSchema>;

/** Teil-Update für die Detailseite (alle Felder optional). */
export const habitPatchSchema = habitInputSchema.partial();
export type HabitPatch = z.infer<typeof habitPatchSchema>;
