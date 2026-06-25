import { z } from 'zod';

export const eventInputSchema = z.object({
	calendar_id: z.string().uuid(),
	title: z.string().min(1).max(200),
	start: z.string(),
	end: z.string(),
	all_day: z.boolean().default(false),
	location: z.string().nullable().default(null),
	rrule: z.string().nullable().default(null)
});

export type EventInput = z.infer<typeof eventInputSchema>;

export const calendarInputSchema = z.object({
	name: z.string().min(1).max(100),
	color: z.string().nullable().default(null)
});

export type CalendarInput = z.infer<typeof calendarInputSchema>;
