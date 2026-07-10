import { supabase } from '$lib/core/supabase';

export interface DBScoreEntry {
	id?: string;
	workspace_id: string;
	user_id: string;
	date: string;
	total: number;
	breakdown: any;
	created_at?: string;
}

export async function getRecentScores(
	workspaceId: string,
	userId: string,
	sinceDate: string
): Promise<DBScoreEntry[]> {
	const { data, error } = await supabase
		.from('life_scores')
		.select('*')
		.eq('workspace_id', workspaceId)
		.eq('user_id', userId)
		.gte('date', sinceDate)
		.order('date', { ascending: true });
	if (error) throw error;
	return data ?? [];
}

export async function upsertScore(
	workspaceId: string,
	userId: string,
	date: string,
	total: number,
	breakdown: any
): Promise<DBScoreEntry> {
	const { data, error } = await supabase
		.from('life_scores')
		.upsert(
			{ workspace_id: workspaceId, user_id: userId, date, total, breakdown },
			{ onConflict: 'user_id,date' }
		)
		.select()
		.single();
	if (error) throw error;
	return data;
}
