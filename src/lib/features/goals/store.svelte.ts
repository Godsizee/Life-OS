import { authState } from '$lib/core/auth.svelte';
import { toISODate } from '$lib/core/date';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import { ladeSicher } from '$lib/core/store-load';
import * as goalsApi from './api';
import { attachmentsState } from '$lib/features/attachments/store.svelte';
import { goalCheckinInputSchema, goalInputSchema, journalEntryInputSchema, type GoalInput } from './schema';
import type { Goal, GoalCheckin, GoalStatus, JournalEntry, JournalKind, DayContext } from './types';
import { isValidEntryDate } from './journal-stats';

class GoalsState {
	goals = $state<Goal[]>([]);
	journalEntries = $state<JournalEntry[]>([]);
	checkins = $state<GoalCheckin[]>([]);
	loading = $state(false);
	loaded = $state(false);
	private workspaceId: string | null = null;
	private unsubscribeGoals: (() => void) | null = null;
	private unsubscribeJournal: (() => void) | null = null;
	private unsubscribeCheckins: (() => void) | null = null;
	private purgedOutbox = false;

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
		outbox.registerExecutor('goal_checkins', {
			insert: (payload) => goalsApi.insertGoalCheckinRaw(payload as GoalCheckin),
			delete: (payload) => goalsApi.deleteGoalCheckin((payload as { id: string }).id)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		const ok = await ladeSicher('Ziele & Tagebuch', async () => {
			[this.goals, this.journalEntries, this.checkins] = await Promise.all([
				goalsApi.listGoals(workspaceId),
				goalsApi.listJournalEntries(workspaceId),
				goalsApi.listGoalCheckins(workspaceId)
			]);
		});
		this.loading = false;
		if (!ok) {
			this.workspaceId = null;
			return;
		}
		this.loaded = true;
		this.subscribe();
		void this.purgeInvalidJournalMutations();
	}

	private subscribe() {
		this.unsubscribeGoals?.();
		this.unsubscribeJournal?.();
		this.unsubscribeCheckins?.();
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
		this.unsubscribeCheckins = subscribeToTable<GoalCheckin>(
			'goal_checkins',
			this.workspaceId,
			{
				onInsert: (row) => {
					if (!this.checkins.some((c) => c.id === row.id))
						this.checkins = [row, ...this.checkins];
				},
				onUpdate: (row) => {
					this.checkins = this.checkins.map((c) => (c.id === row.id ? row : c));
				},
				onDelete: ({ id }) => {
					this.checkins = this.checkins.filter((c) => c.id !== id);
				}
			}
		);
	}

	unload() {
		this.unsubscribeGoals?.();
		this.unsubscribeJournal?.();
		this.unsubscribeCheckins?.();
		this.unsubscribeGoals = null;
		this.unsubscribeJournal = null;
		this.unsubscribeCheckins = null;
		this.goals = [];
		this.journalEntries = [];
		this.checkins = [];
		this.loaded = false;
		this.workspaceId = null;
	}

	async addGoal(input: { title: string } & Partial<GoalInput>) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = goalInputSchema.parse(input);
		const now = new Date().toISOString();
		const goal: Goal = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			parent_id: parsed.parent_id ?? null,
			title: parsed.title,
			description: parsed.description ?? '',
			target_date: parsed.target_date ?? null,
			progress: 0,
			status: 'open',
			goal_type: parsed.goal_type ?? 'standard',
			target_exercise: parsed.target_exercise ?? null,
			target_value: parsed.target_value ?? null,
			target_unit: parsed.target_unit ?? null,
			archived: false,
			created_by: authState.user!.id,
			created_at: now,
			updated_at: now
		};
		this.goals = [...this.goals, goal];
		await outbox.runOrQueue('goals', 'insert', goal, () => goalsApi.insertGoalRaw(goal));
	}

	async archiveGoal(id: string) {
		const updated_at = new Date().toISOString();
		this.goals = this.goals.map((g) => (g.id === id ? { ...g, archived: true, updated_at } : g));
		await outbox.runOrQueue('goals', 'update', { id, archived: true, updated_at }, () =>
			goalsApi.updateGoalRaw({ id, archived: true, updated_at })
		);
	}

	async unarchiveGoal(id: string) {
		const updated_at = new Date().toISOString();
		this.goals = this.goals.map((g) => (g.id === id ? { ...g, archived: false, updated_at } : g));
		await outbox.runOrQueue('goals', 'update', { id, archived: false, updated_at }, () =>
			goalsApi.updateGoalRaw({ id, archived: false, updated_at })
		);
	}

	async loadArchived() {
		if (!this.workspaceId) return;
		const allGoals = await goalsApi.listGoals(this.workspaceId, true);
		const existingIds = new Set(this.goals.map((g) => g.id));
		const toAdd = allGoals.filter((g) => !existingIds.has(g.id));
		if (toAdd.length > 0) {
			this.goals = [...this.goals, ...toAdd];
		}
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

	get todayKey(): string {
		return toISODate(new Date());
	}

	get todayEntry(): JournalEntry | undefined {
		return this.entryForDate(this.todayKey);
	}

	async saveTodayEntry(mood: string | null, body: string, context: DayContext | null = null) {
		await this.saveJournalEntry(this.todayKey, mood, body, context);
	}

	// ── Check-ins ───────────────────────────────────────────────────────────
	checkinsFor(goalId: string): GoalCheckin[] {
		return this.checkins.filter((c) => c.goal_id === goalId);
	}

	async addCheckin(input: { goal_id: string; date: string; value: number; note?: string | null }) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = goalCheckinInputSchema.parse(input);
		const row: GoalCheckin = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			goal_id: parsed.goal_id,
			user_id: authState.user!.id,
			date: parsed.date,
			value: parsed.value,
			note: parsed.note ?? null,
			created_at: new Date().toISOString()
		};
		this.checkins = [row, ...this.checkins];
		// Ein Check-in ist Fortschritt: das Ziel gilt ab jetzt als "in Arbeit".
		const goal = this.goals.find((g) => g.id === parsed.goal_id);
		if (goal?.status === 'open') void this.setStatus(goal.id, 'in_progress');
		await outbox.runOrQueue('goal_checkins', 'insert', row, () =>
			goalsApi.insertGoalCheckinRaw(row)
		);
	}

	async removeCheckin(id: string) {
		this.checkins = this.checkins.filter((c) => c.id !== id);
		await outbox.runOrQueue('goal_checkins', 'delete', { id }, () =>
			goalsApi.deleteGoalCheckin(id)
		);
	}

	/** Tageseintrag eines Datums. Wochen-Reviews (kind='weekly') zählen hier nie mit. */
	entryForDate(date: string): JournalEntry | undefined {
		return this.journalEntries.find((j) => j.date === date && j.kind !== 'weekly');
	}

	/**
	 * Liefert die ID des Tageseintrags und legt ihn notfalls leer an —
	 * Anhänge brauchen eine existierende Entity-ID (Plan §5, Regel 15).
	 */
	async ensureEntry(date: string): Promise<string> {
		const existing = this.entryForDate(date);
		if (existing) return existing.id;
		await this.saveJournalEntry(date, null, '');
		return this.entryForDate(date)!.id;
	}

	async saveJournalEntry(
		date: string,
		mood: string | null,
		body: string,
		context: DayContext | null = null,
		kind: JournalKind = 'daily'
	) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = journalEntryInputSchema.parse({ date, mood, body, kind });
		const existing = this.journalEntries.find(
			(j) => j.date === parsed.date && j.kind === parsed.kind
		);
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
			kind: parsed.kind,
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

	async removeJournalEntry(id: string) {
		// Reihenfolge ist Pflicht: die attachments-DELETE-Policy prüft per EXISTS, ob
		// der Journal-Eintrag noch sichtbar ist. Nach dem Löschen wären Anhänge verwaist.
		await attachmentsState.removeForEntity('journal', id);
		this.journalEntries = this.journalEntries.filter((j) => j.id !== id);
		await outbox.runOrQueue('journal_entries', 'delete', { id }, () =>
			goalsApi.deleteJournalEntry(id)
		);
	}

	/**
	 * Einmalig pro Session: entfernt Journal-Mutationen mit ungültigem Datum aus der
	 * Outbox. Solche Zeilen (Alt-Bestand des Weekly-Review-Bugs, Plan §3.5) scheitern
	 * serverseitig für immer.
	 *
	 * Den allgemeinen Fall deckt inzwischen das Dead-Letter der Outbox ab
	 * (MAX_ATTEMPTS in core/outbox.svelte.ts). Diese Entgiftung bleibt, weil sie den
	 * bekannten Alt-Bestand sofort räumt, statt erst nach fünf Fehlversuchen.
	 */
	private async purgeInvalidJournalMutations() {
		if (this.purgedOutbox) return;
		this.purgedOutbox = true;
		try {
			const all = await outbox.getAll();
			for (const m of all) {
				if (m.table !== 'journal_entries') continue;
				const date = (m.payload as { date?: unknown })?.date;
				if (typeof date !== 'string' || !isValidEntryDate(date)) {
					await outbox.remove(m.seq!);
				}
			}
		} catch {
			// Kein IndexedDB (SSR/Privatmodus) — die Entgiftung ist reine Kür.
		}
	}
}

export const goalsState = new GoalsState();
