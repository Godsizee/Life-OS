import { supabase } from '$lib/core/supabase';
import type { TimeEntry } from './types';

export async function listTimeEntries(
	workspaceId: string,
	userId: string,
	sinceIso: string
): Promise<TimeEntry[]> {
	const { data, error } = await supabase
		.from('time_entries')
		.select('*')
		.eq('workspace_id', workspaceId)
		.eq('user_id', userId)
		.gte('started_at', sinceIso)
		.order('started_at', { ascending: false });
	if (error) throw error;
	return data ?? [];
}

export async function insertTimeEntryRaw(entry: TimeEntry): Promise<TimeEntry> {
	const { data, error } = await supabase.from('time_entries').insert(entry).select().single();
	if (error) throw error;
	return data;
}

export async function deleteTimeEntry(id: string): Promise<void> {
	const { error } = await supabase.from('time_entries').delete().eq('id', id);
	if (error) throw error;
}
