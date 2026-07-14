import { supabase } from '$lib/core/supabase';
import type {
	WorkoutPlan,
	WorkoutExercise,
	WorkoutLog,
	WorkoutSetLog,
	PersonalRecord,
	ExerciseCatalogEntry
} from './types';

export async function listPlans(workspaceId: string): Promise<WorkoutPlan[]> {
	const { data, error } = await supabase
		.from('workout_plans')
		.select('*')
		.eq('workspace_id', workspaceId)
		.order('name');
	if (error) throw error;
	return data ?? [];
}

export async function insertPlanRaw(plan: WorkoutPlan): Promise<WorkoutPlan> {
	const { data, error } = await supabase.from('workout_plans').insert(plan).select().single();
	if (error) throw error;
	return data;
}

export async function updatePlanRaw(plan: Partial<WorkoutPlan> & { id: string }): Promise<WorkoutPlan> {
	const { data, error } = await supabase
		.from('workout_plans')
		.update(plan)
		.eq('id', plan.id)
		.select()
		.single();
	if (error) throw error;
	return data;
}

export async function deletePlan(id: string): Promise<void> {
	const { error } = await supabase.from('workout_plans').delete().eq('id', id);
	if (error) throw error;
}

export async function listExercises(planId: string): Promise<WorkoutExercise[]> {
	const { data, error } = await supabase
		.from('workout_exercises')
		.select('*')
		.eq('plan_id', planId)
		.order('order_index');
	if (error) throw error;
	return data ?? [];
}

export async function insertExerciseRaw(exercise: WorkoutExercise): Promise<WorkoutExercise> {
	const { data, error } = await supabase.from('workout_exercises').insert(exercise).select().single();
	if (error) throw error;
	return data;
}

export async function deleteExercise(id: string): Promise<void> {
	const { error } = await supabase.from('workout_exercises').delete().eq('id', id);
	if (error) throw error;
}

export async function listLogs(workspaceId: string): Promise<WorkoutLog[]> {
	const { data, error } = await supabase
		.from('workout_logs')
		.select('*')
		.eq('workspace_id', workspaceId)
		.order('date', { ascending: false });
	if (error) throw error;
	return data ?? [];
}

export async function listSetLogs(logId: string): Promise<WorkoutSetLog[]> {
	const { data, error } = await supabase
		.from('workout_set_logs')
		.select('*')
		.eq('log_id', logId)
		.order('exercise_name, set_index');
	if (error) throw error;
	return data ?? [];
}

export async function insertLogRaw(log: WorkoutLog): Promise<WorkoutLog> {
	const { data, error } = await supabase.from('workout_logs').insert(log).select().single();
	if (error) throw error;
	return data;
}

export async function insertSetLogsRaw(sets: WorkoutSetLog[]): Promise<WorkoutSetLog[]> {
	const { data, error } = await supabase.from('workout_set_logs').insert(sets).select();
	if (error) throw error;
	return data ?? [];
}

export async function listPersonalRecords(
	workspaceId: string,
	userId: string
): Promise<PersonalRecord[]> {
	const { data, error } = await supabase
		.from('personal_records')
		.select('*')
		.eq('workspace_id', workspaceId)
		.eq('user_id', userId)
		.order('exercise_name');
	if (error) throw error;
	return data ?? [];
}

export async function upsertPersonalRecord(record: PersonalRecord): Promise<PersonalRecord> {
	const { data, error } = await supabase
		.from('personal_records')
		.upsert(record, { onConflict: 'workspace_id,user_id,exercise_name' })
		.select()
		.single();
	if (error) throw error;
	return data;
}

// ── Welle F1: Übungskatalog ────────────────────────────────────────────────

/** Globaler Katalog (workspace_id null) + Custom-Übungen dieses Workspace. */
export async function listCatalog(workspaceId: string): Promise<ExerciseCatalogEntry[]> {
	const { data, error } = await supabase
		.from('exercise_catalog')
		.select('*')
		.or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
		.order('name_de');
	if (error) throw error;
	return data ?? [];
}

export async function insertCustomExerciseRaw(
	entry: ExerciseCatalogEntry
): Promise<ExerciseCatalogEntry> {
	const { data, error } = await supabase.from('exercise_catalog').insert(entry).select().single();
	if (error) throw error;
	return data;
}

export async function deleteCustomExercise(id: string): Promise<void> {
	const { error } = await supabase.from('exercise_catalog').delete().eq('id', id);
	if (error) throw error;
}

/** Sätze mehrerer Logs auf einmal — Basis für „zuletzt verwendet" im ExercisePicker. */
export async function listSetLogsForLogs(
	logIds: string[]
): Promise<Pick<WorkoutSetLog, 'exercise_id' | 'exercise_name'>[]> {
	if (logIds.length === 0) return [];
	const { data, error } = await supabase
		.from('workout_set_logs')
		.select('exercise_id, exercise_name')
		.in('log_id', logIds);
	if (error) throw error;
	return data ?? [];
}

// ── Welle F2: „letzte Werte" als Placeholder im Live-Workout ─────────────────

// ── Welle F3: Verlauf & Statistik ─────────────────────────────────────────

export interface DatedSetLog extends WorkoutSetLog {
	date: string;
}

/** Alle erledigten Sätze eines Workspace (mit Workout-Datum) — Basis für Übungs-Progression,
 *  Muskelgruppen-Volumen und Cardio-Statistik. Workspace-weit, daher lazy/gecacht im Store. */
export async function listAllSetLogs(workspaceId: string): Promise<DatedSetLog[]> {
	const { data, error } = await supabase
		.from('workout_set_logs')
		.select('*, workout_logs!inner(workspace_id, date)')
		.eq('workout_logs.workspace_id', workspaceId)
		.eq('completed', true);
	if (error) throw error;
	return (data ?? []).map((row: any) => {
		const { workout_logs, ...rest } = row;
		return { ...rest, date: workout_logs.date } as DatedSetLog;
	});
}

/** Erledigte Sätze der letzten Session, in der diese Übung vorkam (sortiert nach Satz-Nr). */
export async function lastSetsForExercise(
	workspaceId: string,
	exerciseId: string | null,
	exerciseName: string
): Promise<WorkoutSetLog[]> {
	let query = supabase
		.from('workout_set_logs')
		.select('*, workout_logs!inner(workspace_id, date, created_at)')
		.eq('workout_logs.workspace_id', workspaceId)
		.eq('completed', true)
		.order('date', { foreignTable: 'workout_logs', ascending: false })
		.order('created_at', { foreignTable: 'workout_logs', ascending: false })
		.limit(60);
	query = exerciseId
		? query.eq('exercise_id', exerciseId)
		: query.eq('exercise_name', exerciseName).is('exercise_id', null);
	const { data, error } = await query;
	if (error) throw error;
	if (!data || data.length === 0) return [];
	const latestLogId = (data[0] as WorkoutSetLog).log_id;
	return (data as WorkoutSetLog[])
		.filter((s) => s.log_id === latestLogId)
		.sort((a, b) => a.set_index - b.set_index);
}
