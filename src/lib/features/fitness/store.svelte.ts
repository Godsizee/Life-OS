import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as fitnessApi from './api';
import {
	workoutPlanInputSchema,
	workoutExerciseInputSchema,
	customExerciseInputSchema,
	type WorkoutPlanInput,
	type WorkoutExerciseInput,
	type CustomExerciseInput
} from './schema';
import type {
	WorkoutPlan,
	WorkoutExercise,
	WorkoutLog,
	WorkoutSetLog,
	PersonalRecord,
	ExerciseCatalogEntry,
	PickedExercise
} from './types';
import { bestPerExercise, type ExerciseBest } from './utils/1rm';
import { autoLogTrainingHabit, applyPRsToGoals, applyFrequencyToGoals, announcePRs } from './integration';

class FitnessState {
	plans = $state<WorkoutPlan[]>([]);
	exercises = $state<Record<string, WorkoutExercise[]>>({}); // plan_id -> exercises
	logs = $state<WorkoutLog[]>([]);
	records = $state<PersonalRecord[]>([]);
	catalog = $state<ExerciseCatalogEntry[]>([]);
	recentExercises = $state<PickedExercise[]>([]);
	/** Welle F3 — alle erledigten Sätze des Workspace (mit Datum), lazy geladen für Verlauf/Statistik. */
	allSetLogs = $state<fitnessApi.DatedSetLog[]>([]);
	loading = $state(false);
	private workspaceId: string | null = null;
	private unsubscribePlans: (() => void) | null = null;
	private unsubscribeLogs: (() => void) | null = null;
	private lastSetsCache = new Map<string, WorkoutSetLog[]>();
	private allSetLogsLoaded = false;

	availableMuscleGroups = $derived(
		[...new Set(this.catalog.map((e) => e.muscle_group).filter((v): v is string => !!v))].sort()
	);

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
		outbox.registerExecutor('exercise_catalog', {
			insert: (payload) => fitnessApi.insertCustomExerciseRaw(payload as ExerciseCatalogEntry),
			delete: (payload) => fitnessApi.deleteCustomExercise((payload as { id: string }).id)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		try {
			this.plans = await fitnessApi.listPlans(workspaceId);
			this.logs = await fitnessApi.listLogs(workspaceId);
			this.catalog = await fitnessApi.listCatalog(workspaceId);
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
		this.catalog = [];
		this.recentExercises = [];
		this.allSetLogs = [];
		this.allSetLogsLoaded = false;
		this.workspaceId = null;
		this.lastSetsCache.clear();
	}

	/** Welle F3 — einmalig lazy geladen (Verlauf-Tab/Übungs-Detail), workspace-weit daher nicht in load(). */
	async loadAllSetLogs() {
		if (this.allSetLogsLoaded || !this.workspaceId) return;
		this.allSetLogsLoaded = true;
		this.allSetLogs = await fitnessApi.listAllSetLogs(this.workspaceId);
	}

	/** Welle F2 — letzte abgeschlossene Sätze dieser Übung, für Placeholder im Live-Workout. Pro Session gecacht. */
	async lastSetsFor(exerciseId: string | null, exerciseName: string): Promise<WorkoutSetLog[]> {
		if (!this.workspaceId) return [];
		const key = exerciseId ?? `name:${exerciseName.toLowerCase()}`;
		const cached = this.lastSetsCache.get(key);
		if (cached) return cached;
		const sets = await fitnessApi.lastSetsForExercise(this.workspaceId, exerciseId, exerciseName);
		this.lastSetsCache.set(key, sets);
		return sets;
	}

	/** Lazy beim Öffnen des ExercisePicker geladen — zuletzt geloggte Übungen, dedupliziert. */
	async loadRecentExercises() {
		const recentLogIds = this.logs.slice(0, 15).map((l) => l.id);
		const sets = await fitnessApi.listSetLogsForLogs(recentLogIds);
		const seen = new Set<string>();
		const result: PickedExercise[] = [];
		for (const s of sets) {
			const key = s.exercise_id ?? s.exercise_name.toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);
			const catalogEntry = s.exercise_id ? this.catalog.find((e) => e.id === s.exercise_id) : undefined;
			result.push(
				catalogEntry
					? { exercise_id: catalogEntry.id, name: catalogEntry.name_de, exercise_type: catalogEntry.exercise_type }
					: { exercise_id: null, name: s.exercise_name, exercise_type: 'strength' }
			);
			if (result.length >= 8) break;
		}
		this.recentExercises = result;
	}

	async addCustomExercise(input: CustomExerciseInput): Promise<PickedExercise> {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = customExerciseInputSchema.parse(input);
		const now = new Date().toISOString();
		const entry: ExerciseCatalogEntry = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			name_de: parsed.name_de,
			name_en: parsed.name_en,
			exercise_type: parsed.exercise_type,
			muscle_group: parsed.muscle_group,
			equipment: parsed.equipment,
			source: 'custom',
			external_id: null,
			created_at: now,
			updated_at: now
		};
		this.catalog = [...this.catalog, entry];
		await outbox.runOrQueue('exercise_catalog', 'insert', entry, () =>
			fitnessApi.insertCustomExerciseRaw(entry)
		);
		return { exercise_id: entry.id, name: entry.name_de, exercise_type: entry.exercise_type };
	}

	async removeCustomExercise(id: string) {
		this.catalog = this.catalog.filter((e) => e.id !== id);
		await outbox.runOrQueue('exercise_catalog', 'delete', { id }, () =>
			fitnessApi.deleteCustomExercise(id)
		);
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
			order_index: parsed.order_index,
			exercise_id: parsed.exercise_id,
			exercise_type: parsed.exercise_type,
			default_duration_min: parsed.default_duration_min,
			default_distance_km: parsed.default_distance_km
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
		sets: Omit<WorkoutSetLog, 'id' | 'log_id'>[],
		/** Welle F2 — Übungsnamen (lowercase), die während des Live-Workouts bereits per Toast angekündigt wurden. */
		alreadyAnnounced: Set<string> = new Set()
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
			completed: s.completed,
			exercise_id: s.exercise_id,
			exercise_type: s.exercise_type,
			duration_min: s.duration_min,
			distance_km: s.distance_km,
			rpe: s.rpe,
			set_type: s.set_type
		}));

		this.logs = [log, ...this.logs];

		// We run the log creation in parallel to get direct database storage.
		await outbox.runOrQueue('workout_logs', 'insert', log, () => fitnessApi.insertLogRaw(log));
		await fitnessApi.insertSetLogsRaw(setLogs);

		// Welle F3 — Statistik-Cache (falls bereits geladen) sofort um erledigte Sätze ergänzen,
		// statt komplett neu zu laden.
		if (this.allSetLogsLoaded) {
			const completed = setLogs.filter((s) => s.completed).map((s) => ({ ...s, date: todayStr }));
			this.allSetLogs = [...this.allSetLogs, ...completed];
		}

		// ── Welle 5.3: PR-Erkennung + Cross-Modul-Integration ────────────────
		const newPRs = await this.detectAndPersistPRs(setLogs, now);
		autoLogTrainingHabit();
		applyFrequencyToGoals(this.logs);
		if (newPRs.length > 0) {
			const toAnnounce = newPRs.filter((pr) => !alreadyAnnounced.has(pr.exercise_name.toLowerCase()));
			if (toAnnounce.length > 0) announcePRs(toAnnounce);
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
