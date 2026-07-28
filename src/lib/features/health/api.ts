import { supabase } from '$lib/core/supabase';
import { fetchAllPages } from '$lib/core/query';
import type { HealthEntry } from './types';

/** Ohne `id` — gleiche Begruendung wie bei mood/api.ts (Unique-Key statt PK). */
export interface HealthUpsert {
	workspace_id: string;
	user_id: string;
	date: string;
	weight_kg: number | null;
	sleep_h: number | null;
	water_glasses: number | null;
	energy: number | null;
}

export async function listHealthEntries(
	workspaceId: string,
	userId: string,
	sinceDate: string
): Promise<HealthEntry[]> {
	return fetchAllPages<HealthEntry>('health_entries', (from, to) =>
		supabase
			.from('health_entries')
			.select('*')
			.eq('workspace_id', workspaceId)
			.eq('user_id', userId)
			.gte('date', sinceDate)
			.order('date', { ascending: false })
			.order('id')
			.range(from, to)
	);
}

/** Einziger Schreibpfad. Idempotent -> Outbox-Replay-sicher. */
export async function upsertHealthRaw(payload: HealthUpsert): Promise<HealthEntry> {
	const { data, error } = await supabase
		.from('health_entries')
		.upsert(payload, { onConflict: 'workspace_id,user_id,date' })
		.select()
		.single();
	if (error) throw error;
	return data as HealthEntry;
}

export async function deleteHealthEntry(id: string): Promise<void> {
	const { error } = await supabase.from('health_entries').delete().eq('id', id);
	if (error) throw error;
}
