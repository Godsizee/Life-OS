import { z } from 'zod';

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
	entity_id: z.string().uuid().nullable().default(null),
	title: z.string().min(1).max(120),
	body: z.string().max(300).nullable().default(null),
	url: z.string().min(1).max(300).default('/'),
	/** ISO-Zeitpunkt (UTC) der ersten/nächsten Fälligkeit. */
	remind_at: z.string().min(1),
	rrule: z.string().nullable().default(null),
	offset_minutes: z.number().int().min(0).max(20160).default(0)
});

export type ReminderInput = z.infer<typeof reminderInputSchema>;
