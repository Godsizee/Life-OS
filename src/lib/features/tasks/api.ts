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

/**
 * Mehrere Aufgaben in EINEM Request schreiben.
 *
 * Umsortieren erzeugte vorher einen Request pro Geschwister — bei 30 Aufgaben
 * in einer Board-Spalte also 30 Round-Trips fuer einen einzigen Drop.
 *
 * Bewusst vollstaendige Zeilen: `upsert` ist ein INSERT mit ON CONFLICT, ein
 * Teilobjekt wuerde an den NOT-NULL-Spalten scheitern. Die Zeilen liegen im
 * Store ohnehin vollstaendig vor.
 */
export async function upsertManyRaw(tasks: Task[]): Promise<void> {
	if (tasks.length === 0) return;
	const { error } = await supabase.from('tasks').upsert(tasks);
	if (error) throw error;
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
