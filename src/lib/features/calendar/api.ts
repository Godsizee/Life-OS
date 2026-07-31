import { supabase } from '$lib/core/supabase';
import { fetchAllPages } from '$lib/core/query';
import type { Calendar, Event, EventOverride } from './types';

export async function listCalendars(workspaceId: string): Promise<Calendar[]> {
	return fetchAllPages<Calendar>('calendars', (from, to) =>
		supabase
			.from('calendars')
			.select('*')
			.eq('workspace_id', workspaceId)
			.order('created_at')
			.order('id')
			.range(from, to)
	);
}

export async function createCalendar(workspaceId: string, name: string): Promise<Calendar> {
	const { data, error } = await supabase
		.from('calendars')
		.insert({ workspace_id: workspaceId, name })
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function updateCalendarRaw(patch: Partial<Pick<Calendar, 'name' | 'color' | 'ics_url'>> & { id: string }): Promise<Calendar> {
	const { id, ...rest } = patch;
	const { data, error } = await supabase
		.from('calendars')
		.update(rest)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteCalendar(id: string): Promise<void> {
	const { error } = await supabase.from('calendars').delete().eq('id', id);
	if (error) throw error;
}

/**
 * Ohne Zeitfenster und bewusst so: eine Serie mit fruehem `start` laeuft bis
 * heute weiter. Ein Filter auf `start >= x` wuerde genau die Termine wegwerfen,
 * die occurrences.ts noch expandieren muss.
 */
export async function listEvents(workspaceId: string): Promise<Event[]> {
	return fetchAllPages<Event>('events', (from, to) =>
		supabase
			.from('events')
			.select('*')
			.eq('workspace_id', workspaceId)
			.order('start')
			.order('id')
			.range(from, to)
	);
}

export async function insertRaw(event: Event): Promise<Event> {
	const { data, error } = await supabase.from('events').upsert(event).select().single();
	if (error) throw error;
	return data;
}

export async function updateRaw(patch: Partial<Event> & { id: string }): Promise<Event> {
	const { id, ...rest } = patch;
	const { data, error } = await supabase
		.from('events')
		.update(rest)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteEvent(id: string): Promise<void> {
	const { error } = await supabase.from('events').delete().eq('id', id);
	if (error) throw error;
}

export async function listOverrides(workspaceId: string): Promise<EventOverride[]> {
	return fetchAllPages<EventOverride>('event_overrides', (from, to) =>
		supabase
			.from('event_overrides')
			.select('*')
			.eq('workspace_id', workspaceId)
			.order('id')
			.range(from, to)
	);
}

export async function upsertOverrideRaw(row: EventOverride): Promise<EventOverride> {
	const { data, error } = await supabase
		.from('event_overrides')
		.upsert(row, { onConflict: 'event_id,occurrence_date' })
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteOverride(id: string): Promise<void> {
	const { error } = await supabase.from('event_overrides').delete().eq('id', id);
	if (error) throw error;
}
