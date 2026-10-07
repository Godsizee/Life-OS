import { neueId } from '#lib/core/id.js';
import { authState } from '#lib/core/auth.svelte.js';
import { outbox } from '#lib/core/outbox.svelte.js';
import { subscribeToTable } from '#lib/core/realtime.js';
import { ladeSicher } from '#lib/core/store-load.js';
import * as habitsApi from './api';
import { habitInputSchema, habitPatchSchema, type HabitInput, type HabitPatch } from './schema';
import { isCompleted, isSkipped, toHabitDays, toISODate, type HabitDay } from './streak';
import type { Habit, HabitLog, HabitLogStatus } from './types';
import { emit, NUTZER, type Ursache } from '#lib/core/ereignisse.js';

class HabitsState {
	habits = $state<Habit[]>([]);
	archived = $state<Habit[]>([]);
	logs = $state<HabitLog[]>([]);
	loading = $state(false);
	loaded = $state(false);
	archivedLoaded = $state(false);
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
		const ok = await ladeSicher('Routinen', async () => {
			[this.habits, this.logs] = await Promise.all([
				habitsApi.listHabits(workspaceId),
				habitsApi.listLogs(workspaceId)
			]);
		});
		this.loading = false;
		if (!ok) {
			this.workspaceId = null;
			return;
		}
		this.loaded = true;
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
				if (row.archived) {
					this.habits = this.habits.filter((h) => h.id !== row.id);
					if (this.archivedLoaded && !this.archived.some((h) => h.id === row.id)) {
						this.archived = [...this.archived, row];
					}
				} else {
					this.habits = this.habits.map((h) => (h.id === row.id ? row : h));
					if (this.archivedLoaded) {
						this.archived = this.archived.filter((h) => h.id !== row.id);
					}
				}
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

	/** Erneut vom Server laden — Abgleich nach Verbindungsabbruch (core/resync.ts). */
	async reload(workspaceId: string) {
		this.workspaceId = null;
		await this.load(workspaceId);
	}

	unload() {
		this.unsubscribeHabits?.();
		this.unsubscribeLogs?.();
		this.unsubscribeHabits = null;
		this.unsubscribeLogs = null;
		this.unsubscribeLogs = null;
		this.habits = [];
		this.archived = [];
		this.logs = [];
		this.loaded = false;
		this.archivedLoaded = false;
		this.workspaceId = null;
	}

	// ── Lesen ───────────────────────────────────────────────────────────────

	habitById(id: string): Habit | undefined {
		return this.habits.find((h) => h.id === id) ?? this.archived.find((h) => h.id === id);
	}

	/** Alle Tages-Einträge einer Routine in der Form, die `streak.ts` erwartet. */
	entriesFor(habitId: string): HabitDay[] {
		return toHabitDays(this.logs.filter((l) => l.habit_id === habitId));
	}

	/** Nur die Daten, an denen die Routine wirklich ERLEDIGT war (Menge erreicht, nicht übersprungen). */
	logsFor(habitId: string): string[] {
		const habit = this.habitById(habitId);
		const core = {
			schedule: habit?.schedule ?? { type: 'daily' as const },
			target_value: habit?.target_value ?? null
		};
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
			id: neueId(),
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
			clean.target_value =
				parsed.target_value && parsed.target_value > 1 ? parsed.target_value : null;
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

	/** Der Eintrag einer Routine an einem Tag (nur der eigene Nutzer, es gibt höchstens einen). */
	logAm(habitId: string, datum: string): HabitLog | undefined {
		return this.logs.find((l) => l.habit_id === habitId && l.date === datum);
	}

	/**
	 * Einziger Schreibpfad für Tages-Logs.
	 * value <= 0 && status === 'done'  -> Log löschen (Tag ist wieder „nichts").
	 * Es gibt genau EINE Zeile je (habit, user, date) — deshalb update statt insert,
	 * sobald eine existiert (DB-Constraint `unique (habit_id, user_id, date)`).
	 *
	 * `herkunft` wird bei JEDEM Schreiben mitgesendet (Migration 037): Der Default der
	 * Spalte greift nur beim Insert — ohne das bliebe nach einer manuellen Änderung
	 * 'automation:…' stehen.
	 */
	async writeDay(
		habitId: string,
		dateStr: string,
		value: number,
		status: HabitLogStatus,
		herkunft = 'manual',
		ursache: Ursache = NUTZER
	) {
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
			const patch = { id: existing.id, value, status, source: herkunft };
			this.logs = this.logs.map((l) =>
				l.id === existing.id ? { ...l, value, status, source: herkunft } : l
			);
			this.meldeTag(habitId, dateStr, value, status, ursache);
			await outbox.runOrQueue('habit_logs', 'update', patch, () => habitsApi.updateLog(patch));
			return;
		}

		if (status === 'done' && value <= 0) return;
		const log: HabitLog = {
			id: neueId(),
			workspace_id: this.workspaceId,
			habit_id: habitId,
			user_id: authState.user!.id,
			date: dateStr,
			value,
			status,
			source: herkunft,
			created_at: new Date().toISOString()
		};
		this.logs = [...this.logs, log];
		this.meldeTag(habitId, dateStr, value, status, ursache);
		await outbox.runOrQueue('habit_logs', 'insert', log, () => habitsApi.insertLog(log));
	}

	/** Meldet „erledigt" nur, wenn der Tag danach wirklich erledigt ist (Mengen-Routine: Ziel erreicht). */
	private meldeTag(
		habitId: string,
		datum: string,
		value: number,
		status: HabitLogStatus,
		ursache: Ursache
	) {
		if (status === 'skipped') {
			emit('routine.uebersprungen', { habitId, datum }, ursache);
			return;
		}
		if (value >= this.targetOf(habitId)) {
			emit('routine.erledigt', { habitId, datum, wert: value }, ursache);
		}
	}

	targetOf(habitId: string): number {
		const t = this.habitById(habitId)?.target_value ?? null;
		return t && t > 0 ? t : 1;
	}

	/** Häkchen-Verhalten: erledigt <-> nicht erledigt (auch für Mengen-Routinen nutzbar). */
	async toggleToday(habitId: string, herkunft = 'manual') {
		const today = toISODate(new Date());
		if (this.isDoneToday(habitId)) {
			await this.writeDay(habitId, today, 0, 'done', herkunft);
			return;
		}
		await this.writeDay(habitId, today, this.targetOf(habitId), 'done', herkunft);
	}

	/** Mengen-Routine: +delta (Standard +1), gedeckelt auf den Zielwert. */
	async incrementToday(habitId: string, delta = 1, herkunft = 'manual') {
		const today = toISODate(new Date());
		const target = this.targetOf(habitId);
		const current = this.isSkippedToday(habitId) ? 0 : this.valueToday(habitId);
		const next = Math.max(0, Math.min(target, current + delta));
		await this.writeDay(habitId, today, next, 'done', herkunft);
	}

	async setValueToday(habitId: string, value: number, herkunft = 'manual') {
		const today = toISODate(new Date());
		await this.writeDay(habitId, today, Math.max(0, value), 'done', herkunft);
	}

	/** Skip hält den Streak, zählt aber nicht als erledigt. Erneutes Aufrufen hebt ihn auf. */
	async toggleSkipToday(habitId: string, herkunft = 'manual') {
		const today = toISODate(new Date());
		if (this.isSkippedToday(habitId)) {
			await this.writeDay(habitId, today, 0, 'done', herkunft); // -> löscht die Zeile
			return;
		}
		await this.writeDay(habitId, today, 0, 'skipped', herkunft);
	}

	async archiveHabit(id: string) {
		const habit = this.habits.find((h) => h.id === id);
		if (habit) {
			this.habits = this.habits.filter((h) => h.id !== id);
			if (this.archivedLoaded) {
				this.archived = [...this.archived, { ...habit, archived: true }];
			}
		}
		const updated_at = new Date().toISOString();
		// Archivieren beendet die Routine aus Sicht der Erinnerungen wie ein Löschen.
		emit('routine.geloescht', { habitId: id });
		await outbox.runOrQueue('habits', 'update', { id, archived: true, updated_at }, () =>
			habitsApi.updateRaw({ id, archived: true, updated_at })
		);
	}

	async loadArchived() {
		if (this.archivedLoaded || !this.workspaceId) return;
		const alle = await habitsApi.listHabits(this.workspaceId, true);
		this.archived = alle.filter((h) => h.archived);
		this.archivedLoaded = true;
	}

	async unarchiveHabit(id: string) {
		const habit = this.archived.find((h) => h.id === id);
		if (!habit) return;
		this.archived = this.archived.filter((h) => h.id !== id);
		this.habits = [...this.habits, { ...habit, archived: false }];
		await outbox.runOrQueue('habits', 'update', { id, archived: false }, () =>
			habitsApi.updateRaw({ id, archived: false })
		);
	}
}

export const habitsState = new HabitsState();
