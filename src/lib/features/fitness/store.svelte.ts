import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as fitnessApi from './api';
import { workoutPlanInputSchema, workoutExerciseInputSchema, type WorkoutPlanInput, type WorkoutExerciseInput } from './schema';
import type { WorkoutPlan, WorkoutExercise, WorkoutLog, WorkoutSetLog, PersonalRecord } from './types';
import { bestPerExercise, type ExerciseBest } from './utils/1rm';
import { autoLogTrainingHabit, applyPRsToGoals, announcePRs } from './integration';

class FitnessState {
	plans = $state<WorkoutPlan[]>([]);
	exercises = $state<Record<string, WorkoutExercise[]>>({}); // plan_id -> exercises
	logs = $state<WorkoutLog[]>([]);
	records = $state<PersonalRecord[]>([]);
	loading = $state(false);
	private workspaceId: string | null = null;
	private unsubscribePlans: (() => void) | null = null;
	private unsubscribeLogs: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('workout_plans', {
			insert: (payload) => fitnessApi.insertPlanRaw(payload as WorkoutPlan),
			update: (payload) => fitnessApi.updatePlanRaw(payload as any),
			delete: (payload) => fitnessApi.deletePlan((payload as { id: string }).id)
		});
		outbox.registerExecutor('workout_exercises', {
			insert: (payload) => fitnessApi.insertExerciseRaw(payload as WorkoutExercise),
			delete: (payload) => fitnessApi.deleteExercise((payload as { id: string }).id)
		});
		outbox.registerExecutor('workout_logs', {
			insert: (payload) => fitnessApi.insertLogRaw(payload as WorkoutLog)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		try {
			this.plans = await fitnessApi.listPlans(workspaceId);
			this.logs = await fitnessApi.listLogs(workspaceId);
			const uid = authState.user?.id;
			if (uid) this.records = await fitnessApi.listPersonalRecords(workspaceId, uid);

			// Load exercises for all plans
			for (const plan of this.plans) {
				this.exercises[plan.id] = await fitnessApi.listExercises(plan.id);
			}
		} finally {
			this.loading = false;
		}
		this.subscribe();
	}

	private subscribe() {
		this.unsubscribePlans?.();
		this.unsubscribeLogs?.();
		if (!this.workspaceId) return;

		this.unsubscribePlans = subscribeToTable<WorkoutPlan>('workout_plans', this.workspaceId, {
			onInsert: (row) => {
				if (!this.plans.some((p) => p.id === row.id)) this.plans = [...this.plans, row];
			},
			onUpdate: (row) => {
				this.plans = this.plans.map((p) => (p.id === row.id ? row : p));
			},
			onDelete: ({ id }) => {
				this.plans = this.plans.filter((p) => p.id !== id);
			}
		});

		this.unsubscribeLogs = subscribeToTable<WorkoutLog>('workout_logs', this.workspaceId, {
			onInsert: (row) => {
				if (!this.logs.some((l) => l.id === row.id)) this.logs = [row, ...this.logs];
			},
			onUpdate: (row) => {
				this.logs = this.logs.map((l) => (l.id === row.id ? row : l));
			},
			onDelete: ({ id }) => {
				this.logs = this.logs.filter((l) => l.id !== id);
			}
		});
	}

	unload() {
		this.unsubscribePlans?.();
		this.unsubscribeLogs?.();
		this.unsubscribePlans = null;
		this.unsubscribeLogs = null;
		this.plans = [];
		this.exercises = {};
		this.logs = [];
		this.records = [];
		this.workspaceId = null;
	}

	prFor(exerciseName: string): PersonalRecord | undefined {
		const key = exerciseName.toLowerCase();
		return this.records.find((r) => r.exercise_name.toLowerCase() === key);
	}

	async addPlan(input: WorkoutPlanInput): Promise<string> {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = workoutPlanInputSchema.parse(input);
		const id = crypto.randomUUID();
		const now = new Date().toISOString();
		const plan: WorkoutPlan = {
			id,
			workspace_id: this.workspaceId,
			name: parsed.name,
			description: parsed.description,
			created_at: now,
			updated_at: now
		};
		this.plans = [...this.plans, plan];
		this.exercises[id] = [];
		await outbox.runOrQueue('workout_plans', 'insert', plan, () => fitnessApi.insertPlanRaw(plan));
		return id;
	}

	async removePlan(id: string) {
		this.plans = this.plans.filter((p) => p.id !== id);
		delete this.exercises[id];
		await outbox.runOrQueue('workout_plans', 'delete', { id }, () => fitnessApi.deletePlan(id));
	}

	async addExercise(planId: string, input: WorkoutExerciseInput) {
		const parsed = workoutExerciseInputSchema.parse(input);
		const id = crypto.randomUUID();
		const exercise: WorkoutExercise = {
			id,
			plan_id: planId,
			name: parsed.name,
			category: parsed.category,
			default_sets: parsed.default_sets,
			default_reps: parsed.default_reps,
			default_weight: parsed.default_weight,
			order_index: parsed.order_index
		};
		
		const list = this.exercises[planId] ?? [];
		this.exercises[planId] = [...list, exercise].sort((a, b) => a.order_index - b.order_index);
		
		await outbox.runOrQueue('workout_exercises', 'insert', exercise, () =>
			fitnessApi.insertExerciseRaw(exercise)
		);
	}

	async removeExercise(planId: string, id: string) {
		const list = this.exercises[planId] ?? [];
		this.exercises[planId] = list.filter((e) => e.id !== id);
		await outbox.runOrQueue('workout_exercises', 'delete', { id }, () => fitnessApi.deleteExercise(id));
	}

	async logWorkout(
		planId: string | null,
		duration: number | null,
		notes: string | null,
		sets: Omit<WorkoutSetLog, 'id' | 'log_id'>[]
	) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const logId = crypto.randomUUID();
		const now = new Date().toISOString();
		const todayStr = now.split('T')[0];

		const log: WorkoutLog = {
			id: logId,
			workspace_id: this.workspaceId,
			user_id: authState.user!.id,
			plan_id: planId,
			date: todayStr,
			duration_minutes: duration,
			notes: notes,
			created_at: now
		};

		const setLogs: WorkoutSetLog[] = sets.map((s) => ({
			id: crypto.randomUUID(),
			log_id: logId,
			exercise_name: s.exercise_name,
			set_index: s.set_index,
			reps: s.reps,
			weight_kg: s.weight_kg,
			completed: s.completed
		}));

		this.logs = [log, ...this.logs];

		// We run the log creation in parallel to get direct database storage.
		await outbox.runOrQueue('workout_logs', 'insert', log, () => fitnessApi.insertLogRaw(log));
		await fitnessApi.insertSetLogsRaw(setLogs);

		// ── Welle 5.3: PR-Erkennung + Cross-Modul-Integration ────────────────
		const newPRs = await this.detectAndPersistPRs(setLogs, now);
		autoLogTrainingHabit();
		if (newPRs.length > 0) {
			announcePRs(newPRs);
			applyPRsToGoals(newPRs);
		}
	}

	private async detectAndPersistPRs(
		sets: WorkoutSetLog[],
		achievedAt: string
	): Promise<ExerciseBest[]> {
		if (!this.workspaceId) return [];
		const uid = authState.user?.id;
		if (!uid) return [];
		const beaten: ExerciseBest[] = [];
		for (const best of bestPerExercise(sets)) {
			const existing = this.prFor(best.exercise_name);
			if (existing && existing.est_1rm >= best.est_1rm) continue;
			const record: PersonalRecord = {
				id: existing?.id ?? crypto.randomUUID(),
				workspace_id: this.workspaceId,
				user_id: uid,
				exercise_name: best.exercise_name,
				weight_kg: best.weight_kg,
				reps: best.reps,
				est_1rm: best.est_1rm,
				achieved_at: achievedAt
			};
			this.records = existing
				? this.records.map((r) => (r.id === record.id ? record : r))
				: [...this.records, record];
			beaten.push(best);
			try {
				await fitnessApi.upsertPersonalRecord(record);
			} catch (err) {
				console.error('PR speichern fehlgeschlagen:', err);
			}
		}
		return beaten;
	}
}

export const fitnessState = new FitnessState();
