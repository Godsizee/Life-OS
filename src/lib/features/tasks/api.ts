import { supabase } from '$lib/core/supabase';
import type { Project, Task } from './types';

export async function listTasks(workspaceId: string): Promise<Task[]> {
	const { data, error } = await supabase
		.from('tasks')
		.select('*')
		.eq('workspace_id', workspaceId)
		.order('position')
		.order('created_at');
	if (error) throw error;
	return data ?? [];
}

export async function listProjects(workspaceId: string): Promise<Project[]> {
	const { data, error } = await supabase
		.from('projects')
		.select('*')
		.eq('workspace_id', workspaceId)
		.eq('archived', false)
		.order('created_at');
	if (error) throw error;
	return data ?? [];
}

export async function insertRaw(task: Task): Promise<Task> {
	const { data, error } = await supabase.from('tasks').upsert(task).select().single();
	if (error) throw error;
	return data;
}

export async function updateRaw(patch: Partial<Task> & { id: string }): Promise<Task> {
	const { id, ...rest } = patch;
	const { data, error } = await supabase
		.from('tasks')
		.update(rest)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deleteTask(id: string): Promise<void> {
	const { error } = await supabase.from('tasks').delete().eq('id', id);
	if (error) throw error;
}

export async function createProject(workspaceId: string, name: string): Promise<Project> {
	const { data, error } = await supabase
		.from('projects')
		.insert({ workspace_id: workspaceId, name })
		.select()
		.single();
	if (error) throw error;
	return data;
}
