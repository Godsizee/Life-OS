import { supabase } from '$lib/core/supabase';
import type { Reminder } from './types';

export async function listReminders(workspaceId: string): Promise<Reminder[]> {
	const { data, error } = await supabase
		.from('reminders')
		.select('*')
		.eq('workspace_id', workspaceId)
		.order('remind_at');
	if (error) throw error;
	return data ?? [];
}

export async function insertRaw(reminder: Reminder): Promise<Reminder> {
	const { data, error } = await supabase.from('reminders').upsert(reminder).select().single();
	if (error) throw error;
	return data;
}

export async function updateRaw(patch: Partial<Reminder> & { id: string }): Promise<Reminder> {
	const { id, ...rest } = patch;
	const { data, error } = await supabase
		.from('reminders')
		.update(rest)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteReminder(id: string): Promise<void> {
	const { error } = await supabase.from('reminders').delete().eq('id', id);
	if (error) throw error;
}
