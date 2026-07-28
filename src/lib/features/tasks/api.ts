import { supabase } from '$lib/core/supabase';
import { fetchAllPages } from '$lib/core/query';
import type { Project, Task } from './types';

export async function listTasks(workspaceId: string): Promise<Task[]> {
	return fetchAllPages<Task>('tasks', (from, to) =>
		supabase
			.from('tasks')
			.select('*')
			.eq('workspace_id', workspaceId)
			.order('position')
			.order('created_at')
			.order('id') // eindeutiger Tiebreaker — sonst wackelt die Seitengrenze
			.range(from, to)
	);
}

export async function listProjects(workspaceId: string): Promise<Project[]> {
	return fetchAllPages<Project>('projects', (from, to) =>
		supabase
			.from('projects')
			.select('*')
			.eq('workspace_id', workspaceId)
			.eq('archived', false)
			.order('created_at')
			.order('id')
			.range(from, to)
	);
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

/** upsert statt insert -> ein Outbox-Replay darf die Zeile erneut schreiben. */
export async function insertProjectRaw(project: Project): Promise<Project> {
	const { data, error } = await supabase.from('projects').upsert(project).select().single();
	if (error) throw error;
	return data;
}

export async function deleteProject(id: string): Promise<void> {
	const { error } = await supabase.from('projects').delete().eq('id', id);
	if (error) throw error;
}
