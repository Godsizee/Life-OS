import { supabase } from '$lib/core/supabase';
import type { Attachment } from './types';

export const BUCKET = 'attachments';
export const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function listAttachments(workspaceId: string): Promise<Attachment[]> {
	const { data, error } = await supabase
		.from('attachments')
		.select('*')
		.eq('workspace_id', workspaceId)
		.order('created_at', { ascending: true });
	if (error) throw error;
	return data ?? [];
}

/** upsert statt insert -> ein Outbox-Replay darf die Zeile erneut schreiben. */
export async function upsertAttachmentRaw(row: Attachment): Promise<Attachment> {
	const { data, error } = await supabase.from('attachments').upsert(row).select().single();
	if (error) throw error;
	return data;
}

export async function deleteAttachmentRow(id: string): Promise<void> {
	const { error } = await supabase.from('attachments').delete().eq('id', id);
	if (error) throw error;
}

export async function uploadObject(path: string, blob: Blob, mimeType: string): Promise<void> {
	const { error } = await supabase.storage
		.from(BUCKET)
		.upload(path, blob, { contentType: mimeType, upsert: true, cacheControl: '3600' });
	if (error) throw error;
}

/** remove() auf einen nicht (mehr) existierenden Pfad ist fehlerfrei -> idempotent. */
export async function deleteObject(path: string): Promise<void> {
	const { error } = await supabase.storage.from(BUCKET).remove([path]);
	if (error) throw error;
}

/** Gebuendelte signierte URLs: storage_path -> URL. */
export async function createSignedUrls(paths: string[]): Promise<Record<string, string>> {
	if (paths.length === 0) return {};
	const { data, error } = await supabase.storage
		.from(BUCKET)
		.createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
	if (error) throw error;
	const out: Record<string, string> = {};
	for (const entry of data ?? []) {
		if (entry.path && entry.signedUrl) out[entry.path] = entry.signedUrl;
	}
	return out;
}
