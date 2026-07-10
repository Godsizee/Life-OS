import { supabase } from '$lib/core/supabase';
import type { MoodEntry } from './types';

export async function getTodayMood(
	workspaceId: string,
	userId: string,
	date: string
): Promise<MoodEntry | null> {
	const { data } = await supabase
		.from('mood_entries')
		.select('*')
		.eq('workspace_id', workspaceId)
		.eq('user_id', userId)
		.eq('date', date)
		.maybeSingle();
	return data ?? null;
}

export async function upsertMood(
	workspaceId: string,
	userId: string,
	date: string,
	score: number,
	note: string | null
): Promise<MoodEntry> {
	const { data, error } = await supabase
		.from('mood_entries')
		.upsert(
			{ workspace_id: workspaceId, user_id: userId, date, score, note },
			{ onConflict: 'workspace_id,user_id,date' }
		)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function getWeekMoods(
	workspaceId: string,
	userId: string,
	sinceDate: string
): Promise<MoodEntry[]> {
	const { data, error } = await supabase
		.from('mood_entries')
		.select('*')
		.eq('workspace_id', workspaceId)
		.eq('user_id', userId)
		.gte('date', sinceDate)
		.order('date');
	if (error) throw error;
	return data ?? [];
}

export async function getMonthMoods(
	workspaceId: string,
	userId: string,
	sinceDate: string
): Promise<MoodEntry[]> {
	const { data, error } = await supabase
		.from('mood_entries')
		.select('*')
		.eq('workspace_id', workspaceId)
		.eq('user_id', userId)
		.gte('date', sinceDate)
		.order('date');
	if (error) throw error;
	return data ?? [];
}
