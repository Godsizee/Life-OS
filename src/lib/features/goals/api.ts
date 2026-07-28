import { supabase } from '$lib/core/supabase';
import { fetchAllPages } from '$lib/core/query';
import type { Goal, GoalCheckin, JournalEntry } from './types';

export async function listGoals(workspaceId: string): Promise<Goal[]> {
	return fetchAllPages<Goal>('goals', (from, to) =>
		supabase
			.from('goals')
			.select('*')
			.eq('workspace_id', workspaceId)
			.order('created_at')
			.order('id')
			.range(from, to)
	);
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
// Ohne Zeitfenster: „An diesem Tag" blickt bewusst Jahre zurueck.
export async function listJournalEntries(workspaceId: string): Promise<JournalEntry[]> {
	return fetchAllPages<JournalEntry>('journal_entries', (from, to) =>
		supabase
			.from('journal_entries')
			.select('*')
			.eq('workspace_id', workspaceId)
			.order('date', { ascending: false })
			.order('id')
			.range(from, to)
	);
}

export async function upsertJournalEntry(entry: JournalEntry): Promise<JournalEntry> {
	const { data, error } = await supabase
		.from('journal_entries')
		.upsert(entry, { onConflict: 'user_id,date,kind' })
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteJournalEntry(id: string): Promise<void> {
	const { error } = await supabase.from('journal_entries').delete().eq('id', id);
	if (error) throw error;
}

// W8 — Check-ins sind geteilt (RLS "members rw" wie goals selbst).
export async function listGoalCheckins(workspaceId: string): Promise<GoalCheckin[]> {
	return fetchAllPages<GoalCheckin>('goal_checkins', (from, to) =>
		supabase
			.from('goal_checkins')
			.select('*')
			.eq('workspace_id', workspaceId)
			.order('date', { ascending: false })
			.order('id')
			.range(from, to)
	);
}

// upsert statt insert -> ein Outbox-Replay darf beliebig oft laufen.
export async function insertGoalCheckinRaw(row: GoalCheckin): Promise<GoalCheckin> {
	const { data, error } = await supabase.from('goal_checkins').upsert(row).select().single();
	if (error) throw error;
	return data;
}

export async function deleteGoalCheckin(id: string): Promise<void> {
	const { error } = await supabase.from('goal_checkins').delete().eq('id', id);
	if (error) throw error;
}
