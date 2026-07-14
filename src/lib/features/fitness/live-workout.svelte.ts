// Welle F2 — Live-Workout 2.0: die laufende (noch ungespeicherte) Session lebt hier
// statt im Komponenten-State von routes/fitness/+page.svelte, damit ein Reload oder
// App-Wechsel sie nicht verwirft. Draft in localStorage, Vorbild focus/store.svelte.ts
// (kein Shared-Wrapper im Projekt — jedes Feature persistiert selbst).
import { fitnessState } from './store.svelte';
import { estimateOneRepMax } from './utils/1rm';
import { announcePRs } from './integration';
import type { ActiveSetLog, ExerciseType, PickedExercise, SetType, WorkoutSetLog } from './types';

const DRAFT_KEY = 'lifeos:fitness:draft';
const DRAFT_VERSION = 1;

interface DraftPayload {
	v: number;
	active: boolean;
	planId: string | null;
	startedAt: string | null;
	sets: ActiveSetLog[];
	notes: string;
	durationOverrideMin: number | null;
	/** Welle F6 — Endzeitpunkt (epoch ms) des laufenden Pausen-Timers, überlebt Reload. */
	restEndsAt?: number | null;
}

// Welle F6 — Reihenfolge für das Durch-Tippen des Satz-Typ-Labels (Hevy-Muster).
const SET_TYPE_CYCLE: SetType[] = ['normal', 'warmup', 'dropset', 'failure'];

function defaultReps(type: ExerciseType): number | null {
	return type === 'strength' ? 10 : null;
}
function defaultDuration(type: ExerciseType): number | null {
	return type !== 'strength' ? 10 : null;
}
function lastValueKey(exerciseId: string | null, exerciseName: string): string {
	return exerciseId ?? `name:${exerciseName.toLowerCase()}`;
}

class LiveWorkoutState {
	active = $state(false);
	planId = $state<string | null>(null);
	startedAt = $state<string | null>(null);
	sets = $state<ActiveSetLog[]>([]);
	notes = $state('');
	durationOverrideMin = $state<number | null>(null);
	/** Welle F6 — Pausen-Timer lebt im Store (statt Komponenten-State), überlebt so Navigation + Reload. */
	restEndsAt = $state<number | null>(null);
	/** letzte abgeschlossene Sätze je Übung (aus fitnessState.lastSetsFor), Basis für Input-Placeholder. */
	lastValues = $state<Record<string, WorkoutSetLog[]>>({});

	/** Übungsnamen (lowercase), für die in dieser Session bereits ein PR-Toast gefeuert wurde. */
	announcedPRs = new Set<string>();
	private restoredOnce = false;

	isFreestyle = $derived(this.active && this.planId === null);
	exerciseNames = $derived([...new Set(this.sets.map((s) => s.exercise_name))]);

	setsFor(exerciseName: string): ActiveSetLog[] {
		return this.sets.filter((s) => s.exercise_name === exerciseName);
	}

	lastValuesFor(exerciseId: string | null, exerciseName: string): WorkoutSetLog[] {
		return this.lastValues[lastValueKey(exerciseId, exerciseName)] ?? [];
	}

	private async loadLastValues(exerciseId: string | null, exerciseName: string) {
		const key = lastValueKey(exerciseId, exerciseName);
		if (this.lastValues[key]) return;
		const sets = await fitnessState.lastSetsFor(exerciseId, exerciseName);
		this.lastValues = { ...this.lastValues, [key]: sets };
	}

	private resetSession() {
		this.notes = '';
		this.durationOverrideMin = null;
		this.restEndsAt = null;
		this.lastValues = {};
		this.announcedPRs = new Set();
	}

	// ── Welle F6: Pausen-Timer ────────────────────────────────────────────────
	startRest(durationSec: number) {
		this.restEndsAt = Date.now() + durationSec * 1000;
	}

	/** ±15s-Anpassung am laufenden Timer; unter 1s Rest wird gestoppt. */
	adjustRest(deltaSec: number) {
		if (this.restEndsAt === null) return;
		const next = this.restEndsAt + deltaSec * 1000;
		this.restEndsAt = next - Date.now() < 1000 ? null : next;
	}

	stopRest() {
		this.restEndsAt = null;
	}

	restRemainingSec(): number | null {
		if (this.restEndsAt === null) return null;
		return Math.max(0, Math.ceil((this.restEndsAt - Date.now()) / 1000));
	}

	/** Welle F6 — Satz-Typ durch-tippen: Normal → Warmup → Dropset → Failure. */
	cycleSetType(id: string) {
		const set = this.sets.find((s) => s.id === id);
		if (!set) return;
		const i = SET_TYPE_CYCLE.indexOf(set.set_type);
		set.set_type = SET_TYPE_CYCLE[(i + 1) % SET_TYPE_CYCLE.length];
	}

	startFromPlan(planId: string) {
		this.resetSession();
		const exs = fitnessState.exercises[planId] ?? [];
		const sets: ActiveSetLog[] = [];
		exs.forEach((e) => {
			for (let i = 0; i < e.default_sets; i++) {
				sets.push({
					id: crypto.randomUUID(),
					exercise_name: e.name,
					exercise_id: e.exercise_id,
					exercise_type: e.exercise_type,
					set_index: i + 1,
					reps: e.exercise_type === 'strength' ? e.default_reps : null,
					weight_kg: e.exercise_type === 'strength' ? e.default_weight : null,
					duration_min: e.exercise_type !== 'strength' ? e.default_duration_min : null,
					distance_km: e.exercise_type === 'cardio' ? e.default_distance_km : null,
					rpe: null,
					set_type: 'normal',
					completed: false
				});
			}
			void this.loadLastValues(e.exercise_id, e.name);
		});
		this.sets = sets;
		this.active = true;
		this.planId = planId;
		this.startedAt = new Date().toISOString();
	}

	startFreestyle() {
		this.resetSession();
		this.sets = [];
		this.active = true;
		this.planId = null;
		this.startedAt = new Date().toISOString();
	}

	/** Übung hinzufügen — beim Aufbau eines Freestyle-Workouts oder mitten im laufenden Training. */
	addExercise(picked: PickedExercise, count = 1) {
		const already = this.setsFor(picked.name).length;
		const additions: ActiveSetLog[] = [];
		for (let i = 0; i < Math.max(1, count); i++) {
			additions.push({
				id: crypto.randomUUID(),
				exercise_name: picked.name,
				exercise_id: picked.exercise_id,
				exercise_type: picked.exercise_type,
				set_index: already + i + 1,
				reps: defaultReps(picked.exercise_type),
				weight_kg: null,
				duration_min: defaultDuration(picked.exercise_type),
				distance_km: null,
				rpe: null,
				set_type: 'normal',
				completed: false
			});
		}
		this.sets = [...this.sets, ...additions];
		void this.loadLastValues(picked.exercise_id, picked.name);
	}

	/** „+ Satz" — übernimmt Reps/Gewicht bzw. Dauer/Strecke des zuletzt hinzugefügten Satzes dieser Übung. */
	addSet(exerciseName: string) {
		const existing = this.setsFor(exerciseName);
		const template = existing[existing.length - 1];
		if (!template) return;
		this.sets = [
			...this.sets,
			{
				id: crypto.randomUUID(),
				exercise_name: template.exercise_name,
				exercise_id: template.exercise_id,
				exercise_type: template.exercise_type,
				set_index: existing.length + 1,
				reps: template.reps,
				weight_kg: template.weight_kg,
				duration_min: template.duration_min,
				distance_km: template.distance_km,
				rpe: null,
				set_type: 'normal',
				completed: false
			}
		];
	}

	removeSet(id: string) {
		const removed = this.sets.find((s) => s.id === id);
		if (!removed) return;
		const rest = this.sets.filter((s) => s.id !== id);
		let idx = 0;
		this.sets = rest.map((s) =>
			s.exercise_name === removed.exercise_name ? { ...s, set_index: ++idx } : s
		);
	}

	removeExercise(exerciseName: string) {
		this.sets = this.sets.filter((s) => s.exercise_name !== exerciseName);
	}

	/** Toggle + sofortiges PR-Feedback (Punkt 8) — Persistenz/Zielabgleich erst beim finalen Speichern. */
	toggleComplete(id: string) {
		const set = this.sets.find((s) => s.id === id);
		if (!set) return;
		set.completed = !set.completed;
		if (
			!set.completed ||
			set.exercise_type !== 'strength' ||
			set.set_type === 'warmup' ||
			!set.weight_kg ||
			set.weight_kg <= 0 ||
			!set.reps ||
			set.reps <= 0
		) {
			return;
		}
		const key = set.exercise_name.toLowerCase();
		if (this.announcedPRs.has(key)) return;
		const est1rm = estimateOneRepMax(set.weight_kg, set.reps);
		const existingPR = fitnessState.prFor(set.exercise_name);
		if (existingPR && est1rm <= existingPR.est_1rm) return;
		this.announcedPRs.add(key);
		announcePRs([{ exercise_name: set.exercise_name, weight_kg: set.weight_kg, reps: set.reps, est_1rm: est1rm }]);
	}

	elapsedMinutes(): number | null {
		if (!this.startedAt) return null;
		return Math.max(0, Math.round((Date.now() - new Date(this.startedAt).getTime()) / 60000));
	}

	cancel() {
		this.active = false;
		this.planId = null;
		this.startedAt = null;
		this.sets = [];
		this.resetSession();
		this.clearDraft();
	}

	/** Nach erfolgreichem Speichern — Session beenden, ohne die Draft-Löschung doppelt zu loggen. */
	finish() {
		this.cancel();
	}

	persist() {
		if (typeof window === 'undefined') return;
		if (!this.active) {
			this.clearDraft();
			return;
		}
		try {
			const payload: DraftPayload = {
				v: DRAFT_VERSION,
				active: this.active,
				planId: this.planId,
				startedAt: this.startedAt,
				sets: this.sets,
				notes: this.notes,
				durationOverrideMin: this.durationOverrideMin,
				restEndsAt: this.restEndsAt
			};
			localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
		} catch {}
	}

	/** Einmalig beim Mount der Fitness-Seite aufrufen (Vorbild focusState.loadToday()). */
	restore() {
		if (this.restoredOnce || typeof window === 'undefined') return;
		this.restoredOnce = true;
		try {
			const raw = localStorage.getItem(DRAFT_KEY);
			if (!raw) return;
			const payload = JSON.parse(raw) as DraftPayload;
			if (payload.v !== DRAFT_VERSION || !payload.active) return;
			// Drafts von vor F6 haben kein set_type — auf 'normal' normalisieren.
			this.sets = (payload.sets ?? []).map((s) => ({ ...s, set_type: s.set_type ?? 'normal' }));
			this.notes = payload.notes ?? '';
			this.durationOverrideMin = payload.durationOverrideMin ?? null;
			const restEndsAt = payload.restEndsAt ?? null;
			this.restEndsAt = restEndsAt !== null && restEndsAt > Date.now() ? restEndsAt : null;
			this.active = true;
			this.planId = payload.planId;
			this.startedAt = payload.startedAt;
			for (const name of this.exerciseNames) {
				const s = this.sets.find((set) => set.exercise_name === name);
				if (s) void this.loadLastValues(s.exercise_id, s.exercise_name);
			}
		} catch {
			this.clearDraft();
		}
	}

	private clearDraft() {
		try {
			localStorage.removeItem(DRAFT_KEY);
		} catch {}
	}
}

export const liveWorkoutState = new LiveWorkoutState();
