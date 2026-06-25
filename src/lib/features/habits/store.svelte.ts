import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as habitsApi from './api';
import { habitInputSchema, type HabitInput } from './schema';
import { toISODate } from './streak';
import type { Habit, HabitLog } from './types';

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
			created_at: now,
			updated_at: now
		};
		this.habits = [...this.habits, habit];
		await outbox.runOrQueue('habits', 'insert', habit, () => habitsApi.insertRaw(habit));
	}

	logsFor(habitId: string): string[] {
		return this.logs.filter((l) => l.habit_id === habitId).map((l) => l.date);
	}

	isLoggedToday(habitId: string): boolean {
		const today = toISODate(new Date());
		return this.logs.some((l) => l.habit_id === habitId && l.date === today);
	}

	async toggleToday(habitId: string) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const today = toISODate(new Date());
		const existing = this.logs.find((l) => l.habit_id === habitId && l.date === today);
		if (existing) {
			this.logs = this.logs.filter((l) => l.id !== existing.id);
			await outbox.runOrQueue('habit_logs', 'delete', { id: existing.id }, () =>
				habitsApi.deleteLog(existing.id)
			);
			return;
		}
		const log: HabitLog = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			habit_id: habitId,
			user_id: authState.user!.id,
			date: today,
			value: 1,
			created_at: new Date().toISOString()
		};
		this.logs = [...this.logs, log];
		await outbox.runOrQueue('habit_logs', 'insert', log, () => habitsApi.insertLog(log));
	}

	async archiveHabit(id: string) {
		this.habits = this.habits.filter((h) => h.id !== id);
		const updated_at = new Date().toISOString();
		await outbox.runOrQueue(
			'habits',
			'update',
			{ id, archived: true, updated_at },
			() => habitsApi.updateRaw({ id, archived: true, updated_at })
		);
	}
}

export const habitsState = new HabitsState();
