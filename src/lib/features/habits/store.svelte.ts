import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as habitsApi from './api';
import { habitInputSchema, habitPatchSchema, type HabitInput, type HabitPatch } from './schema';
import { isCompleted, isSkipped, toHabitDays, toISODate, type HabitDay } from './streak';
import type { Habit, HabitLog, HabitLogStatus } from './types';
import { remindersState } from '$lib/features/reminders/store.svelte';

class HabitsState {
	habits = $state<Habit[]>([]);
	logs = $state<HabitLog[]>([]);
	loading = $state(false);
	private workspaceId: string | null = null;
	private unsubscribeHabits: (() => void) | null = null;
	private unsubscribeLogs: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('habits', {
			insert: (payload) => habitsApi.insertRaw(payload as Habit),
			update: (payload) => habitsApi.updateRaw(payload as Partial<Habit> & { id: string })
		});
		outbox.registerExecutor('habit_logs', {
			insert: (payload) => habitsApi.insertLog(payload as HabitLog),
			update: (payload) => habitsApi.updateLog(payload as Partial<HabitLog> & { id: string }),
			delete: (payload) => habitsApi.deleteLog((payload as { id: string }).id)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		try {
			[this.habits, this.logs] = await Promise.all([
				habitsApi.listHabits(workspaceId),
				habitsApi.listLogs(workspaceId)
			]);
		} finally {
			this.loading = false;
		}
		this.subscribe();
	}

	private subscribe() {
		this.unsubscribeHabits?.();
		this.unsubscribeLogs?.();
		if (!this.workspaceId) return;
		this.unsubscribeHabits = subscribeToTable<Habit>('habits', this.workspaceId, {
			onInsert: (row) => {
				if (!this.habits.some((h) => h.id === row.id)) this.habits = [...this.habits, row];
			},
			onUpdate: (row) => {
				this.habits = row.archived
					? this.habits.filter((h) => h.id !== row.id)
					: this.habits.map((h) => (h.id === row.id ? row : h));
			},
			onDelete: ({ id }) => {
				this.habits = this.habits.filter((h) => h.id !== id);
			}
		});
		this.unsubscribeLogs = subscribeToTable<HabitLog>('habit_logs', this.workspaceId, {
			onInsert: (row) => {
				if (!this.logs.some((l) => l.id === row.id)) this.logs = [...this.logs, row];
			},
			// W5: Menge/Skip ändern eine bestehende Zeile — ohne das bleibt der
			// zweite Client auf dem alten Wert stehen.
			onUpdate: (row) => {
				this.logs = this.logs.map((l) => (l.id === row.id ? row : l));
			},
			onDelete: ({ id }) => {
				this.logs = this.logs.filter((l) => l.id !== id);
			}
		});
	}

	unload() {
		this.unsubscribeHabits?.();
		this.unsubscribeLogs?.();
		this.unsubscribeHabits = null;
		this.unsubscribeLogs = null;
		this.habits = [];
		this.logs = [];
		this.workspaceId = null;
	}

	// ── Lesen ───────────────────────────────────────────────────────────────

	habitById(id: string): Habit | undefined {
		return this.habits.find((h) => h.id === id);
	}

	/** Alle Tages-Einträge einer Routine in der Form, die `streak.ts` erwartet. */
	entriesFor(habitId: string): HabitDay[] {
		return toHabitDays(this.logs.filter((l) => l.habit_id === habitId));
	}

	/** Nur die Daten, an denen die Routine wirklich ERLEDIGT war (Menge erreicht, nicht übersprungen). */
	logsFor(habitId: string): string[] {
		const habit = this.habitById(habitId);
		const core = { schedule: habit?.schedule ?? { type: 'daily' as const }, target_value: habit?.target_value ?? null };
		return this.entriesFor(habitId)
			.filter((d) => isCompleted(core, d))
			.map((d) => d.date);
	}

	entryToday(habitId: string): HabitDay | undefined {
		const today = toISODate(new Date());
		return this.entriesFor(habitId).find((d) => d.date === today);
	}

	/** Heutiger Wert einer Mengen-Routine (0, wenn nichts geloggt). */
	valueToday(habitId: string): number {
		return this.entryToday(habitId)?.value ?? 0;
	}

	isDoneToday(habitId: string): boolean {
		const habit = this.habitById(habitId);
		if (!habit) return false;
		return isCompleted(habit, this.entryToday(habitId));
	}

	isSkippedToday(habitId: string): boolean {
		return isSkipped(this.entryToday(habitId));
	}

	// ── Schreiben ───────────────────────────────────────────────────────────

	async addHabit(input: { name: string } & Partial<HabitInput>) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = habitInputSchema.parse(input);
		const now = new Date().toISOString();
		const habit: Habit = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			name: parsed.name,
			schedule: parsed.schedule,
			color: parsed.color,
			archived: false,
			goal_id: parsed.goal_id ?? null,
			target_value: parsed.target_value && parsed.target_value > 1 ? parsed.target_value : null,
			unit: parsed.unit,
			created_at: now,
			updated_at: now
		};
		this.habits = [...this.habits, habit];
		await outbox.runOrQueue('habits', 'insert', habit, () => habitsApi.insertRaw(habit));
	}

	/** Generisches Teil-Update (Name, Schedule, Zielwert, Einheit, Farbe, Ziel-Link). */
	async updateHabit(id: string, patch: HabitPatch) {
		const parsed = habitPatchSchema.parse(patch);
		const clean: Partial<Habit> = { ...parsed };
		if ('target_value' in parsed) {
			clean.target_value = parsed.target_value && parsed.target_value > 1 ? parsed.target_value : null;
		}
		const updated_at = new Date().toISOString();
		this.habits = this.habits.map((h) => (h.id === id ? { ...h, ...clean, updated_at } : h));
		await outbox.runOrQueue('habits', 'update', { id, ...clean, updated_at }, () =>
			habitsApi.updateRaw({ id, ...clean, updated_at })
		);
	}

	async updateGoalLink(id: string, goal_id: string | null) {
		await this.updateHabit(id, { goal_id });
	}

	/**
	 * Einziger Schreibpfad für Tages-Logs.
	 * value <= 0 && status === 'done'  -> Log löschen (Tag ist wieder „nichts").
	 * Es gibt genau EINE Zeile je (habit, user, date) — deshalb update statt insert,
	 * sobald eine existiert (DB-Constraint `unique (habit_id, user_id, date)`).
	 */
	private async writeDay(habitId: string, dateStr: string, value: number, status: HabitLogStatus) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const existing = this.logs.find((l) => l.habit_id === habitId && l.date === dateStr);

		if (existing) {
			if (status === 'done' && value <= 0) {
				this.logs = this.logs.filter((l) => l.id !== existing.id);
				await outbox.runOrQueue('habit_logs', 'delete', { id: existing.id }, () =>
					habitsApi.deleteLog(existing.id)
				);
				return;
			}
			const patch = { id: existing.id, value, status };
			this.logs = this.logs.map((l) => (l.id === existing.id ? { ...l, value, status } : l));
			await outbox.runOrQueue('habit_logs', 'update', patch, () => habitsApi.updateLog(patch));
			return;
		}

		if (status === 'done' && value <= 0) return;
		const log: HabitLog = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			habit_id: habitId,
			user_id: authState.user!.id,
			date: dateStr,
			value,
			status,
			created_at: new Date().toISOString()
		};
		this.logs = [...this.logs, log];
		await outbox.runOrQueue('habit_logs', 'insert', log, () => habitsApi.insertLog(log));
	}

	private targetOf(habitId: string): number {
		const t = this.habitById(habitId)?.target_value ?? null;
		return t && t > 0 ? t : 1;
	}

	/** Häkchen-Verhalten: erledigt <-> nicht erledigt (auch für Mengen-Routinen nutzbar). */
	async toggleToday(habitId: string) {
		const today = toISODate(new Date());
		if (this.isDoneToday(habitId)) {
			await this.writeDay(habitId, today, 0, 'done');
			return;
		}
		await this.writeDay(habitId, today, this.targetOf(habitId), 'done');
	}

	/** Mengen-Routine: +delta (Standard +1), gedeckelt auf den Zielwert. */
	async incrementToday(habitId: string, delta = 1) {
		const today = toISODate(new Date());
		const target = this.targetOf(habitId);
		const current = this.isSkippedToday(habitId) ? 0 : this.valueToday(habitId);
		const next = Math.max(0, Math.min(target, current + delta));
		await this.writeDay(habitId, today, next, 'done');
	}

	async setValueToday(habitId: string, value: number) {
		const today = toISODate(new Date());
		await this.writeDay(habitId, today, Math.max(0, value), 'done');
	}

	/** Skip hält den Streak, zählt aber nicht als erledigt. Erneutes Aufrufen hebt ihn auf. */
	async toggleSkipToday(habitId: string) {
		const today = toISODate(new Date());
		if (this.isSkippedToday(habitId)) {
			await this.writeDay(habitId, today, 0, 'done'); // -> löscht die Zeile
			return;
		}
		await this.writeDay(habitId, today, 0, 'skipped');
	}

	async archiveHabit(id: string) {
		this.habits = this.habits.filter((h) => h.id !== id);
		const updated_at = new Date().toISOString();
		await outbox.runOrQueue('habits', 'update', { id, archived: true, updated_at }, () =>
			habitsApi.updateRaw({ id, archived: true, updated_at })
		);
		await remindersState.removeFor('habit', id);
	}
}

export const habitsState = new HabitsState();
