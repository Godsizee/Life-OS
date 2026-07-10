import { supabase } from '$lib/core/supabase';
import type { HealthEntry } from './types';

export async function getTodayHealth(
	workspaceId: string,
	userId: string,
	date: string
): Promise<HealthEntry | null> {
	const { data } = await supabase
		.from('health_entries')
		.select('*')
		.eq('workspace_id', workspaceId)
		.eq('user_id', userId)
		.eq('date', date)
		.maybeSingle();
	return data ?? null;
}

export async function upsertHealth(
	workspaceId: string,
	userId: string,
	payload: {
		date: string;
		weight_kg: number | null;
		sleep_h: number | null;
		water_glasses: number | null;
		energy: number | null;
	}
): Promise<HealthEntry> {
	const { data, error } = await supabase
		.from('health_entries')
		.upsert(
			{ workspace_id: workspaceId, user_id: userId, ...payload },
			{ onConflict: 'workspace_id,user_id,date' }
		)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function getRecentHealth(
	workspaceId: string,
	userId: string,
	sinceDate: string
): Promise<HealthEntry[]> {
	const { data, error } = await supabase
		.from('health_entries')
		.select('*')
		.eq('workspace_id', workspaceId)
		.eq('user_id', userId)
		.gte('date', sinceDate)
		.order('date', { ascending: false });
	if (error) throw error;
	return data ?? [];
}
