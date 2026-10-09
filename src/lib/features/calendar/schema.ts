import * as z from 'zod/mini';

export const eventInputSchema = z.object({
	calendar_id: z.uuid(),
	title: z.string().check(z.minLength(1), z.maxLength(200)),
	start: z.string(),
	end: z.string(),
	all_day: z._default(z.boolean(), false),
	location: z._default(z.nullable(z.string()), null),
	rrule: z._default(z.nullable(z.string()), null),
	attendee_ids: z._default(z.array(z.uuid()), [])
});

export type EventInput = z.infer<typeof eventInputSchema>;

export const calendarInputSchema = z.object({
	name: z.string().check(z.minLength(1), z.maxLength(100)),
	color: z._default(z.nullable(z.string()), null)
});

export type CalendarInput = z.infer<typeof calendarInputSchema>;
