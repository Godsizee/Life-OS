import { supabase } from '$lib/core/supabase';
import type { Habit, HabitLog } from './types';

export async function listHabits(workspaceId: string): Promise<Habit[]> {
	const { data, error } = await supabase
		.from('habits')
		.select('*')
		.eq('workspace_id', workspaceId)
		.eq('archived', false)
		.order('created_at');
	if (error) throw error;
	return data ?? [];
}

export async function listLogs(workspaceId: string): Promise<HabitLog[]> {
	const { data, error } = await supabase
		.from('habit_logs')
		.select('*')
		.eq('workspace_id', workspaceId);
	if (error) throw error;
	return data ?? [];
}

export async function insertRaw(habit: Habit): Promise<Habit> {
	const { data, error } = await supabase.from('habits').upsert(habit).select().single();
	if (error) throw error;
	return data;
}

export async function updateRaw(patch: Partial<Habit> & { id: string }): Promise<Habit> {
	const { id, ...rest } = patch;
	const { data, error } = await supabase
		.from('habits')
		.update(rest)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function insertLog(log: HabitLog): Promise<HabitLog> {
	const { data, error } = await supabase.from('habit_logs').upsert(log).select().single();
	if (error) throw error;
	return data;
}

export async function deleteLog(id: string): Promise<void> {
	const { error } = await supabase.from('habit_logs').delete().eq('id', id);
	if (error) throw error;
}
