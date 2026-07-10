import { supabase } from '$lib/core/supabase';
import type { WorkoutPlan, WorkoutExercise, WorkoutLog, WorkoutSetLog, PersonalRecord } from './types';

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
