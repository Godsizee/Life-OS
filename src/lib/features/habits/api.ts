import { supabase } from '$lib/core/supabase';
import { fetchAllPages, seitTagen, VERLAUF_TAGE } from '$lib/core/query';
import type { Habit, HabitLog } from './types';

export async function listHabits(workspaceId: string): Promise<Habit[]> {
	return fetchAllPages<Habit>('habits', (from, to) =>
		supabase
			.from('habits')
			.select('*')
			.eq('workspace_id', workspaceId)
			.eq('archived', false)
			.order('created_at')
			.order('id')
			.range(from, to)
	);
}

/**
 * Logs im Verlaufsfenster (Default 400 Tage). Die am schnellsten wachsende
 * Tabelle der App: Anzahl Routinen x Tage. Fenster UND Paging sind noetig —
 * bei 5 Routinen sind 1000 Zeilen (das PostgREST-Limit) nach ~7 Monaten erreicht.
 */
export async function listLogs(
	workspaceId: string,
	sinceDate: string = seitTagen(VERLAUF_TAGE.habitLogs)
): Promise<HabitLog[]> {
	return fetchAllPages<HabitLog>('habit_logs', (from, to) =>
		supabase
			.from('habit_logs')
			.select('*')
			.eq('workspace_id', workspaceId)
			.gte('date', sinceDate)
			.order('date')
			.order('id')
			.range(from, to)
	);
}

export async function insertRaw(habit: Habit): Promise<Habit> {
	const { data, error } = await supabase.from('habits').upsert(habit).select().single();
	if (error) throw error;
	return data;
}

export async function updateRaw(patch: Partial<Habit> & { id: string }): Promise<Habit> {
	const { id, ...rest } = patch;
	const { data, error } = await supabase
		.from('habits')
		.update(rest)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function insertLog(log: HabitLog): Promise<HabitLog> {
	const { data, error } = await supabase.from('habit_logs').upsert(log).select().single();
	if (error) throw error;
	return data;
}

export async function deleteLog(id: string): Promise<void> {
	const { error } = await supabase.from('habit_logs').delete().eq('id', id);
	if (error) throw error;
}

export async function updateLog(patch: Partial<HabitLog> & { id: string }): Promise<HabitLog> {
	const { id, ...rest } = patch;
	const { data, error } = await supabase
		.from('habit_logs')
		.update(rest)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

/** Logs einer einzelnen Routine — für die Detailseite, wenn der Store noch leer ist. */
export async function listLogsForHabit(workspaceId: string, habitId: string): Promise<HabitLog[]> {
	return fetchAllPages<HabitLog>('habit_logs (einzeln)', (from, to) =>
		supabase
			.from('habit_logs')
			.select('*')
			.eq('workspace_id', workspaceId)
			.eq('habit_id', habitId)
			.order('date', { ascending: false })
			.order('id')
			.range(from, to)
	);
}
