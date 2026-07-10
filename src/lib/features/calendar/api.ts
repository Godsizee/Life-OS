import { supabase } from '$lib/core/supabase';
import type { Calendar, Event } from './types';

export async function listCalendars(workspaceId: string): Promise<Calendar[]> {
	const { data, error } = await supabase
		.from('calendars')
		.select('*')
		.eq('workspace_id', workspaceId)
		.order('created_at');
	if (error) throw error;
	return data ?? [];
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

export async function listEvents(workspaceId: string): Promise<Event[]> {
	const { data, error } = await supabase
		.from('events')
		.select('*')
		.eq('workspace_id', workspaceId)
		.order('start');
	if (error) throw error;
	return data ?? [];
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
