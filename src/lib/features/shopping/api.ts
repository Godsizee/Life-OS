import { supabase } from '$lib/core/supabase';
import type { ShoppingItem, WorkspaceSettings } from './types';

export async function listItems(workspaceId: string): Promise<ShoppingItem[]> {
	const { data, error } = await supabase
		.from('shopping_items')
		.select('*')
		.eq('workspace_id', workspaceId)
		.order('checked')
		.order('position')
		.order('created_at');
	if (error) throw error;
	return data ?? [];
}

export async function insertRaw(item: ShoppingItem): Promise<ShoppingItem> {
	const { data, error } = await supabase.from('shopping_items').upsert(item).select().single();
	if (error) throw error;
	return data;
}

export async function updateRaw(
	patch: Partial<ShoppingItem> & { id: string }
): Promise<ShoppingItem> {
	const { id, ...rest } = patch;
	const { data, error } = await supabase
		.from('shopping_items')
		.update(rest)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteItem(id: string): Promise<void> {
	const { error } = await supabase.from('shopping_items').delete().eq('id', id);
	if (error) throw error;
}

export async function deleteChecked(workspaceId: string): Promise<void> {
	const { error } = await supabase
		.from('shopping_items')
		.delete()
		.eq('workspace_id', workspaceId)
		.eq('checked', true);
	if (error) throw error;
}

export async function getWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings> {
  const { data, error } = await supabase
    .from('workspace_settings')
    .select('settings')
    .eq('workspace_id', workspaceId)
    .maybeSingle();
  if (error) throw error;
  return (data?.settings as WorkspaceSettings) ?? {};
}

export async function upsertWorkspaceSettings(
  workspaceId: string,
  settings: WorkspaceSettings
): Promise<void> {
  const { error } = await supabase
    .from('workspace_settings')
    .upsert({ workspace_id: workspaceId, settings, updated_at: new Date().toISOString() });
  if (error) throw error;
}
