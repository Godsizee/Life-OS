import { supabase } from '$lib/core/supabase';
import type { Note } from './types';

export async function listNotes(workspaceId: string): Promise<Note[]> {
	const { data, error } = await supabase
		.from('notes')
		.select('*')
		.eq('workspace_id', workspaceId)
		.order('pinned', { ascending: false })
		.order('updated_at', { ascending: false });
	if (error) throw error;
	return data ?? [];
}

export async function insertRaw(note: Note): Promise<Note> {
	const { data, error } = await supabase.from('notes').upsert(note).select().single();
	if (error) throw error;
	return data;
}

export async function updateRaw(patch: Partial<Note> & { id: string }): Promise<Note> {
	const { id, ...rest } = patch;
	const { data, error } = await supabase
		.from('notes')
		.update(rest)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteNote(id: string): Promise<void> {
	const { error } = await supabase.from('notes').delete().eq('id', id);
	if (error) throw error;
}
