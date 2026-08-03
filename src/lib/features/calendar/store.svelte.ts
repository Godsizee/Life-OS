import { neueId } from '$lib/core/id';
import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import { ladeSicher } from '$lib/core/store-load';
import * as calendarApi from './api';
import { eventInputSchema, type EventInput, calendarInputSchema, type CalendarInput } from './schema';
import type { Calendar, Event, EventOverride, EventOverridePatch } from './types';
import { remindersState } from '$lib/features/reminders/store.svelte';

class CalendarState {
	calendars = $state<Calendar[]>([]);
	events = $state<Event[]>([]);
	overrides = $state<EventOverride[]>([]);
	loading = $state(false);
	loaded = $state(false);
	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;
	private unsubscribeOverrides: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('events', {
			insert: (payload) => calendarApi.insertRaw(payload as Event),
			update: (payload) => calendarApi.updateRaw(payload as Partial<Event> & { id: string }),
			delete: (payload) => calendarApi.deleteEvent((payload as { id: string }).id)
		});
		outbox.registerExecutor('calendars', {
			insert: (payload) => calendarApi.createCalendar(this.workspaceId!, (payload as Calendar).name),
			update: (payload) => calendarApi.updateCalendarRaw(payload as Partial<Calendar> & { id: string }),
			delete: (payload) => calendarApi.deleteCalendar((payload as { id: string }).id)
		});
		outbox.registerExecutor('event_overrides', {
			insert: (payload) => calendarApi.upsertOverrideRaw(payload as EventOverride),
			update: (payload) => calendarApi.upsertOverrideRaw(payload as EventOverride),
			delete: (payload) => calendarApi.deleteOverride((payload as { id: string }).id)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		const ok = await ladeSicher('Kalender', async () => {
			this.calendars = await calendarApi.listCalendars(workspaceId);
			if (this.calendars.length === 0) {
				const created = await calendarApi.createCalendar(workspaceId, 'Kalender');
				this.calendars = [created];
			}
			// Termine und Overrides sind voneinander unabhängig — parallel statt nacheinander.
			[this.events, this.overrides] = await Promise.all([
				calendarApi.listEvents(workspaceId),
				calendarApi.listOverrides(workspaceId)
			]);
		});
		this.loading = false;
		if (!ok) {
			this.workspaceId = null;
			return;
		}
		this.loaded = true;
		this.subscribe();
	}

	private subscribe() {
		this.unsubscribe?.();
		this.unsubscribeOverrides?.();
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
		this.unsubscribeOverrides = subscribeToTable<EventOverride>('event_overrides', this.workspaceId, {
			onInsert: (row) => {
				this.overrides = this.overrides.some((o) => o.id === row.id)
					? this.overrides.map((o) => (o.id === row.id ? row : o))
					: [...this.overrides, row];
			},
			onUpdate: (row) => {
				this.overrides = this.overrides.map((o) => (o.id === row.id ? row : o));
			},
			onDelete: ({ id }) => {
				this.overrides = this.overrides.filter((o) => o.id !== id);
			}
		});
	}

	/** Erneut vom Server laden — Abgleich nach Verbindungsabbruch (core/resync.ts). */
	async reload(workspaceId: string) {
		this.workspaceId = null;
		await this.load(workspaceId);
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.unsubscribeOverrides?.();
		this.unsubscribeOverrides = null;
		this.calendars = [];
		this.events = [];
		this.overrides = [];
		this.loaded = false;
		this.workspaceId = null;
	}

	get defaultCalendarId(): string | null {
		return this.calendars[0]?.id ?? null;
	}

	async addCalendar(input: CalendarInput) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = calendarInputSchema.parse(input);
		const now = new Date().toISOString();
		const cal: Calendar = {
			id: neueId(),
			workspace_id: this.workspaceId,
			name: parsed.name,
			color: parsed.color,
			ics_url: null,
			ics_last_synced_at: null,
			created_at: now,
			updated_at: now
		};
		this.calendars = [...this.calendars, cal];
		await outbox.runOrQueue('calendars', 'insert', cal, () => calendarApi.createCalendar(this.workspaceId!, cal.name).then(async (c) => {
			if (cal.color) {
				await calendarApi.updateCalendarRaw({ id: c.id, color: cal.color });
			}
		}));
	}

	async renameCalendar(id: string, name: string) {
		this.calendars = this.calendars.map((c) => (c.id === id ? { ...c, name, updated_at: new Date().toISOString() } : c));
		await outbox.runOrQueue('calendars', 'update', { id, name }, () => calendarApi.updateCalendarRaw({ id, name }));
	}

	async setCalendarColor(id: string, color: string) {
		this.calendars = this.calendars.map((c) => (c.id === id ? { ...c, color, updated_at: new Date().toISOString() } : c));
		await outbox.runOrQueue('calendars', 'update', { id, color }, () => calendarApi.updateCalendarRaw({ id, color }));
	}

	async updateCalendarUrl(id: string, ics_url: string | null) {
		this.calendars = this.calendars.map((c) => (c.id === id ? { ...c, ics_url, updated_at: new Date().toISOString() } : c));
		await outbox.runOrQueue('calendars', 'update', { id, ics_url }, () => calendarApi.updateCalendarRaw({ id, ics_url }));
	}

	async removeCalendar(id: string) {
		if (this.calendars.length <= 1) {
			throw new Error('Der letzte Kalender kann nicht gelöscht werden.');
		}
		const hasEvents = this.events.some((e) => e.calendar_id === id);
		if (hasEvents) {
			throw new Error('Kalender enthält noch Termine und kann daher nicht gelöscht werden.');
		}
		this.calendars = this.calendars.filter((c) => c.id !== id);
		await outbox.runOrQueue('calendars', 'delete', { id }, () => calendarApi.deleteCalendar(id));
	}

	async addEvent(input: { title: string; start: string; end: string } & Partial<EventInput>) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const calendarId = input.calendar_id ?? this.defaultCalendarId;
		if (!calendarId) throw new Error('Kein Kalender vorhanden');
		const parsed = eventInputSchema.parse({ ...input, calendar_id: calendarId });
		const now = new Date().toISOString();
		const event: Event = {
			id: neueId(),
			workspace_id: this.workspaceId,
			calendar_id: parsed.calendar_id,
			title: parsed.title,
			start: parsed.start,
			end: parsed.end,
			all_day: parsed.all_day,
			location: parsed.location,
			rrule: parsed.rrule,
			attendee_ids: (parsed as any).attendee_ids ?? [],
			created_by: authState.user!.id,
			created_at: now,
			updated_at: now
		};
		this.events = [...this.events, event];
		await outbox.runOrQueue('events', 'insert', event, () => calendarApi.insertRaw(event));
	}

	async removeEvent(id: string) {
		this.events = this.events.filter((e) => e.id !== id);
		this.overrides = this.overrides.filter((o) => o.event_id !== id);
		await outbox.runOrQueue('events', 'delete', { id }, () => calendarApi.deleteEvent(id));
		await remindersState.removeFor('event', id);
	}

	async cancelOccurrence(eventId: string, occurrenceDate: string) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const existing = this.overrides.find((o) => o.event_id === eventId && o.occurrence_date === occurrenceDate);
		const now = new Date().toISOString();
		const row: EventOverride = {
			id: existing?.id ?? neueId(),
			workspace_id: this.workspaceId,
			event_id: eventId,
			occurrence_date: occurrenceDate,
			cancelled: true,
			patch: {},
			created_at: existing?.created_at ?? now,
			updated_at: now
		};
		this.overrides = existing
			? this.overrides.map((o) => (o.id === row.id ? row : o))
			: [...this.overrides, row];
		await outbox.runOrQueue('event_overrides', 'insert', row, () => calendarApi.upsertOverrideRaw(row));
	}

	async patchOccurrence(eventId: string, occurrenceDate: string, patch: EventOverridePatch) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const existing = this.overrides.find((o) => o.event_id === eventId && o.occurrence_date === occurrenceDate);
		const now = new Date().toISOString();
		const row: EventOverride = {
			id: existing?.id ?? neueId(),
			workspace_id: this.workspaceId,
			event_id: eventId,
			occurrence_date: occurrenceDate,
			cancelled: false,
			patch,
			created_at: existing?.created_at ?? now,
			updated_at: now
		};
		this.overrides = existing
			? this.overrides.map((o) => (o.id === row.id ? row : o))
			: [...this.overrides, row];
		await outbox.runOrQueue('event_overrides', 'insert', row, () => calendarApi.upsertOverrideRaw(row));
	}

	async updateEvent(id: string, patch: Partial<Pick<Event, 'title' | 'start' | 'end' | 'all_day' | 'location' | 'rrule' | 'calendar_id' | 'attendee_ids'>>) {
		const updated_at = new Date().toISOString();
		this.events = this.events.map((e) => (e.id === id ? { ...e, ...patch, updated_at } : e));
		await outbox.runOrQueue('events', 'update', { id, ...patch, updated_at }, () =>
			calendarApi.updateRaw({ id, ...patch, updated_at })
		);
		if ('start' in patch) await remindersState.syncAnchor('event', id, patch.start ?? null);
	}
}

export const calendarState = new CalendarState();
