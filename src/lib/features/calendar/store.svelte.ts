import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as calendarApi from './api';
import { eventInputSchema, type EventInput } from './schema';
import type { Calendar, Event } from './types';

class CalendarState {
	calendars = $state<Calendar[]>([]);
	events = $state<Event[]>([]);
	loading = $state(false);
	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('events', {
			insert: (payload) => calendarApi.insertRaw(payload as Event),
			update: (payload) => calendarApi.updateRaw(payload as Partial<Event> & { id: string }),
			delete: (payload) => calendarApi.deleteEvent((payload as { id: string }).id)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		try {
			this.calendars = await calendarApi.listCalendars(workspaceId);
			if (this.calendars.length === 0) {
				const created = await calendarApi.createCalendar(workspaceId, 'Kalender');
				this.calendars = [created];
			}
			this.events = await calendarApi.listEvents(workspaceId);
		} finally {
			this.loading = false;
		}
		this.subscribe();
	}

	private subscribe() {
		this.unsubscribe?.();
		if (!this.workspaceId) return;
		this.unsubscribe = subscribeToTable<Event>('events', this.workspaceId, {
			onInsert: (row) => {
				if (!this.events.some((e) => e.id === row.id)) this.events = [...this.events, row];
			},
			onUpdate: (row) => {
				this.events = this.events.map((e) => (e.id === row.id ? row : e));
			},
			onDelete: ({ id }) => {
				this.events = this.events.filter((e) => e.id !== id);
			}
		});
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.calendars = [];
		this.events = [];
		this.workspaceId = null;
	}

	get defaultCalendarId(): string | null {
		return this.calendars[0]?.id ?? null;
	}

	async addEvent(input: { title: string; start: string; end: string } & Partial<EventInput>) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const calendarId = input.calendar_id ?? this.defaultCalendarId;
		if (!calendarId) throw new Error('Kein Kalender vorhanden');
		const parsed = eventInputSchema.parse({ ...input, calendar_id: calendarId });
		const now = new Date().toISOString();
		const event: Event = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			calendar_id: parsed.calendar_id,
			title: parsed.title,
			start: parsed.start,
			end: parsed.end,
			all_day: parsed.all_day,
			location: parsed.location,
			rrule: parsed.rrule,
			created_by: authState.user!.id,
			created_at: now,
			updated_at: now
		};
		this.events = [...this.events, event];
		await outbox.runOrQueue('events', 'insert', event, () => calendarApi.insertRaw(event));
	}

	async removeEvent(id: string) {
		this.events = this.events.filter((e) => e.id !== id);
		await outbox.runOrQueue('events', 'delete', { id }, () => calendarApi.deleteEvent(id));
	}
}

export const calendarState = new CalendarState();
