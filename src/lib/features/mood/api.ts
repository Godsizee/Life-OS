import { supabase } from '$lib/core/supabase';
import { fetchAllPages } from '$lib/core/query';
import type { MoodEntry } from './types';

/** Nutzlast eines Upserts — bewusst OHNE `id`:
 *  Der Unique-Key ist (workspace_id, user_id, date). Wuerde der Client eine eigene
 *  UUID mitschicken, wuerde `on conflict do update` den Primaerschluessel der
 *  bestehenden Zeile ueberschreiben und Realtime-Events waeren nicht mehr
 *  zuzuordnen. Die DB vergibt/behaelt die id. */
export interface MoodUpsert {
	id?: string;
	workspace_id: string;
	user_id: string;
	date: string;
	logged_at: string;
	score: number;
	note: string | null;
	activities: string[];
}

export async function listMoodEntries(
	workspaceId: string,
	userId: string,
	sinceDate: string
): Promise<MoodEntry[]> {
	return fetchAllPages<MoodEntry>('mood_entries', (from, to) =>
		supabase
			.from('mood_entries')
			.select('*')
			.eq('workspace_id', workspaceId)
			.eq('user_id', userId)
			.gte('date', sinceDate)
			.order('date')
			.order('logged_at')
			.order('id')
			.range(from, to)
	);
}

/** Fuer den Jahres-Umschalter: exakt ein Kalenderjahr nachladen. */
export async function listMoodEntriesInRange(
	workspaceId: string,
	userId: string,
	fromDate: string,
	toDate: string
): Promise<MoodEntry[]> {
	return fetchAllPages<MoodEntry>('mood_entries (Jahr)', (from, to) =>
		supabase
			.from('mood_entries')
			.select('*')
			.eq('workspace_id', workspaceId)
			.eq('user_id', userId)
			.gte('date', fromDate)
			.lte('date', toDate)
			.order('date')
			.order('logged_at')
			.order('id')
			.range(from, to)
	);
}

/** Einziger Schreibpfad. Idempotent -> Outbox-Replay-sicher. */
export async function upsertMoodRaw(payload: MoodUpsert): Promise<MoodEntry> {
	const { data, error } = await supabase
		.from('mood_entries')
		.upsert(payload, { onConflict: 'workspace_id,user_id,date,logged_at' })
		.select()
		.single();
	if (error) throw error;
	return data as MoodEntry;
}

export async function deleteMoodEntry(id: string): Promise<void> {
	const { error } = await supabase.from('mood_entries').delete().eq('id', id);
	if (error) throw error;
}
