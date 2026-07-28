import { supabase } from '$lib/core/supabase';
import { fetchAllPages } from '$lib/core/query';
import type { EntityLink } from './types';

export async function listLinks(workspaceId: string): Promise<EntityLink[]> {
	return fetchAllPages<EntityLink>('entity_links', (from, to) =>
		supabase
			.from('entity_links')
			.select('*')
			.eq('workspace_id', workspaceId)
			.order('id')
			.range(from, to)
	);
}

export async function insertLinkRaw(link: EntityLink): Promise<EntityLink> {
	const { data, error } = await supabase.from('entity_links').insert(link).select().single();
	if (error) throw error;
	return data;
}

export async function deleteLink(id: string): Promise<void> {
	const { error } = await supabase.from('entity_links').delete().eq('id', id);
	if (error) throw error;
}
