import { authState } from '$lib/core/auth.svelte';
import { toISODate } from '$lib/core/date';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as goalsApi from './api';
import { goalInputSchema, journalEntryInputSchema, type GoalInput } from './schema';
import type { Goal, GoalStatus, JournalEntry, DayContext } from './types';

class GoalsState {
	goals = $state<Goal[]>([]);
	journalEntries = $state<JournalEntry[]>([]);
	loading = $state(false);
	private workspaceId: string | null = null;
	private unsubscribeGoals: (() => void) | null = null;
	private unsubscribeJournal: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('goals', {
			insert: (payload) => goalsApi.insertGoalRaw(payload as Goal),
			update: (payload) => goalsApi.updateGoalRaw(payload as Partial<Goal> & { id: string }),
			delete: (payload) => goalsApi.deleteGoal((payload as { id: string }).id)
		});
		outbox.registerExecutor('journal_entries', {
			insert: (payload) => goalsApi.upsertJournalEntry(payload as JournalEntry),
			update: (payload) => goalsApi.upsertJournalEntry(payload as JournalEntry),
			delete: (payload) => goalsApi.deleteJournalEntry((payload as { id: string }).id)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		try {
			[this.goals, this.journalEntries] = await Promise.all([
				goalsApi.listGoals(workspaceId),
				goalsApi.listJournalEntries(workspaceId)
			]);
		} finally {
			this.loading = false;
		}
		this.subscribe();
	}

	private subscribe() {
		this.unsubscribeGoals?.();
		this.unsubscribeJournal?.();
		if (!this.workspaceId) return;
		this.unsubscribeGoals = subscribeToTable<Goal>('goals', this.workspaceId, {
			onInsert: (row) => {
				if (!this.goals.some((g) => g.id === row.id)) this.goals = [...this.goals, row];
			},
			onUpdate: (row) => {
				this.goals = this.goals.map((g) => (g.id === row.id ? row : g));
			},
			onDelete: ({ id }) => {
				this.goals = this.goals.filter((g) => g.id !== id);
			}
		});
		// journal_entries ist durch RLS personenbezogen - dieser Channel liefert serverseitig
		// ohnehin nur die eigenen Zeilen, kein Partner-Sync vorgesehen (gewollt, kein Bug).
		this.unsubscribeJournal = subscribeToTable<JournalEntry>(
			'journal_entries',
			this.workspaceId,
			{
				onInsert: (row) => {
					if (!this.journalEntries.some((j) => j.id === row.id))
						this.journalEntries = [row, ...this.journalEntries];
				},
				onUpdate: (row) => {
					this.journalEntries = this.journalEntries.map((j) => (j.id === row.id ? row : j));
				},
				onDelete: ({ id }) => {
					this.journalEntries = this.journalEntries.filter((j) => j.id !== id);
				}
			}
		);
	}

	unload() {
		this.unsubscribeGoals?.();
		this.unsubscribeJournal?.();
		this.unsubscribeGoals = null;
		this.unsubscribeJournal = null;
		this.goals = [];
		this.journalEntries = [];
		this.workspaceId = null;
	}

	async addGoal(input: { title: string } & Partial<GoalInput>) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = goalInputSchema.parse(input);
		const now = new Date().toISOString();
		const goal: Goal = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			parent_id: parsed.parent_id,
			title: parsed.title,
			description: parsed.description,
			target_date: parsed.target_date,
			progress: 0,
			status: 'open',
			goal_type: parsed.goal_type,
			target_exercise: parsed.target_exercise,
			target_value: parsed.target_value,
			created_by: authState.user!.id,
			created_at: now,
			updated_at: now
		};
		this.goals = [...this.goals, goal];
		await outbox.runOrQueue('goals', 'insert', goal, () => goalsApi.insertGoalRaw(goal));
	}

	async updateProgress(id: string, progress: number) {
		const clamped = Math.max(0, Math.min(100, progress));
		const updated_at = new Date().toISOString();
		this.goals = this.goals.map((g) =>
			g.id === id ? { ...g, progress: clamped, updated_at } : g
		);
		await outbox.runOrQueue('goals', 'update', { id, progress: clamped, updated_at }, () =>
			goalsApi.updateGoalRaw({ id, progress: clamped, updated_at })
		);
	}

	async setStatus(id: string, status: GoalStatus) {
		const updated_at = new Date().toISOString();
		this.goals = this.goals.map((g) => (g.id === id ? { ...g, status, updated_at } : g));
		await outbox.runOrQueue('goals', 'update', { id, status, updated_at }, () =>
			goalsApi.updateGoalRaw({ id, status, updated_at })
		);
	}

	async removeGoal(id: string) {
		this.goals = this.goals.filter((g) => g.id !== id);
		await outbox.runOrQueue('goals', 'delete', { id }, () => goalsApi.deleteGoal(id));
	}

	entryForDate(date: string): JournalEntry | undefined {
		return this.journalEntries.find((j) => j.date === date);
	}

	get todayKey(): string {
		return toISODate(new Date());
	}

	get todayEntry(): JournalEntry | undefined {
		return this.entryForDate(this.todayKey);
	}

	async saveJournalEntry(
		date: string,
		mood: string | null,
		body: string,
		context: DayContext | null = null
	) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = journalEntryInputSchema.parse({ date, mood, body });
		const existing = this.entryForDate(date);
		const now = new Date().toISOString();
		const entry: JournalEntry = {
			id: existing?.id ?? crypto.randomUUID(),
			workspace_id: this.workspaceId,
			user_id: authState.user!.id,
			date: parsed.date,
			mood: parsed.mood,
			body: parsed.body,
			// Kontext-Snapshot bleibt erhalten, wenn beim Speichern keiner mitkommt.
			context: context ?? existing?.context ?? null,
			created_at: existing?.created_at ?? now,
			updated_at: now
		};
		this.journalEntries = existing
			? this.journalEntries.map((j) => (j.id === entry.id ? entry : j))
			: [entry, ...this.journalEntries];
		await outbox.runOrQueue('journal_entries', existing ? 'update' : 'insert', entry, () =>
			goalsApi.upsertJournalEntry(entry)
		);
	}

	async saveTodayEntry(mood: string | null, body: string, context: DayContext | null = null) {
		await this.saveJournalEntry(this.todayKey, mood, body, context);
	}

	async removeJournalEntry(id: string) {
		this.journalEntries = this.journalEntries.filter((j) => j.id !== id);
		await outbox.runOrQueue('journal_entries', 'delete', { id }, () =>
			goalsApi.deleteJournalEntry(id)
		);
	}
}

export const goalsState = new GoalsState();
