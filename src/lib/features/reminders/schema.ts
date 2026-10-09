import * as z from 'zod/mini';

export const reminderEntityTypeSchema = z.enum([
	'task',
	'event',
	'habit',
	'goal',
	'health',
	'custom'
]);

export const reminderInputSchema = z.object({
	entity_type: reminderEntityTypeSchema,
	entity_id: z._default(z.nullable(z.uuid()), null),
	title: z.string().check(z.minLength(1), z.maxLength(120)),
	body: z._default(z.nullable(z.string().check(z.maxLength(300))), null),
	url: z._default(z.string().check(z.minLength(1), z.maxLength(300)), '/'),
	/** ISO-Zeitpunkt (UTC) der ersten/nächsten Fälligkeit. */
	remind_at: z.string().check(z.minLength(1)),
	rrule: z._default(z.nullable(z.string()), null),
	offset_minutes: z._default(z.int().check(z.minimum(0), z.maximum(20160)), 0)
});

export type ReminderInput = z.infer<typeof reminderInputSchema>;
