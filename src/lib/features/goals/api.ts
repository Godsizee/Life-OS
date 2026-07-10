import { supabase } from '$lib/core/supabase';
import type { Goal, JournalEntry } from './types';

export async function listGoals(workspaceId: string): Promise<Goal[]> {
	const { data, error } = await supabase
		.from('goals')
		.select('*')
		.eq('workspace_id', workspaceId)
		.order('created_at');
	if (error) throw error;
	return data ?? [];
}

export async function insertGoalRaw(goal: Goal): Promise<Goal> {
	const { data, error } = await supabase.from('goals').upsert(goal).select().single();
	if (error) throw error;
	return data;
}

export async function updateGoalRaw(patch: Partial<Goal> & { id: string }): Promise<Goal> {
	const { id, ...rest } = patch;
	const { data, error } = await supabase
		.from('goals')
		.update(rest)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteGoal(id: string): Promise<void> {
	const { error } = await supabase.from('goals').delete().eq('id', id);
	if (error) throw error;
}

// RLS beschraenkt journal_entries serverseitig automatisch auf die eigenen Zeilen.
export async function listJournalEntries(workspaceId: string): Promise<JournalEntry[]> {
	const { data, error } = await supabase
		.from('journal_entries')
		.select('*')
		.eq('workspace_id', workspaceId)
		.order('date', { ascending: false });
	if (error) throw error;
	return data ?? [];
}

export async function upsertJournalEntry(entry: JournalEntry): Promise<JournalEntry> {
	const { data, error } = await supabase
		.from('journal_entries')
		.upsert(entry, { onConflict: 'user_id,date' })
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteJournalEntry(id: string): Promise<void> {
	const { error } = await supabase.from('journal_entries').delete().eq('id', id);
	if (error) throw error;
}
