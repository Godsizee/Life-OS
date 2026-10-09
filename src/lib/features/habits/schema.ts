import * as z from 'zod/mini';

export const habitScheduleSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('daily') }),
	z.object({
		type: z.literal('weekly'),
		days: z.array(z.int().check(z.minimum(0), z.maximum(6))).check(z.minLength(1))
	}),
	z.object({ type: z.literal('weekly_count'), times: z.int().check(z.minimum(1), z.maximum(7)) })
]);

export const habitInputSchema = z.object({
	name: z.string().check(z.minLength(1), z.maxLength(100)),
	schedule: z._default(habitScheduleSchema, { type: 'daily' }),
	color: z._default(z.nullable(z.string()), null),
	/** null = Häkchen-Routine. Werte <= 1 werden wie null behandelt. */
	target_value: z._default(z.nullable(z.number().check(z.positive(), z.maximum(10000))), null),
	unit: z._default(z.nullable(z.string().check(z.maxLength(20))), null),
	goal_id: z.optional(z.nullable(z.uuid()))
});

export type HabitInput = z.infer<typeof habitInputSchema>;

/** Teil-Update für die Detailseite (alle Felder optional). */
export const habitPatchSchema = z.partial(habitInputSchema);
export type HabitPatch = z.infer<typeof habitPatchSchema>;
