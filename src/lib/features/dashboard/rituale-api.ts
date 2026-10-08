import { fetchAllPages } from '#lib/core/query.js';
import { supabase } from '#lib/core/supabase.js';
import type { DayRitual } from './rituale-types';

// RLS beschränkt day_rituals serverseitig auf die eigenen Zeilen.
export async function listRituals(workspaceId: string, seit: string): Promise<DayRitual[]> {
	return fetchAllPages<DayRitual>('day_rituals', (from, to) =>
		supabase
			.from('day_rituals')
			.select('*')
			.eq('workspace_id', workspaceId)
			.gte('date', seit)
			.order('date', { ascending: false })
			.order('id')
			.range(from, to)
	);
}

export async function upsertRitual(row: DayRitual): Promise<void> {
	const { error } = await supabase.from('day_rituals').upsert(row, { onConflict: 'user_id,date' });
	if (error) throw error;
}
