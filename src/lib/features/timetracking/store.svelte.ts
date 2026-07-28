import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import { workspaceState } from '$lib/features/workspace/store.svelte';
import { toISODate } from '$lib/core/date';
import { ladeSicher } from '$lib/core/store-load';
import * as timeApi from './api';
import { timeEntryInputSchema, type TimeEntryInput } from './schema';
import { minutesOf, minutesOnDate, minutesThisWeek, pomodorosOnDate } from './stats';
import type { TimeEntry, TimeSource } from './types';

/** Wie viele Tage der Store vorhält — deckt 30-Tage-Analytics und Weekly Review ab. */
const WINDOW_DAYS = 30;

interface LogOptions {
	source?: TimeSource;
	/** Echter Startzeitpunkt (Fokus-Session, manueller Nachtrag). Default: jetzt − Dauer. */
	startedAt?: Date;
	note?: string | null;
}

class TimeTrackingState {
	entries = $state<TimeEntry[]>([]);
	loading = $state(false);
	loaded = $state(false);
	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;

	constructor() {
		// Einträge sind unveränderlich — es gibt bewusst keinen `update`-Executor.
		outbox.registerExecutor('time_entries', {
			insert: (p) => timeApi.insertTimeEntryRaw(p as TimeEntry),
			delete: (p) => timeApi.deleteTimeEntry((p as { id: string }).id)
		});
	}

	async load() {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;
		if (this.workspaceId === wId) return;
		this.workspaceId = wId;
		this.loading = true;
		const ok = await ladeSicher('Zeiterfassung', async () => {
			const since = new Date();
			since.setDate(since.getDate() - WINDOW_DAYS);
			this.entries = await timeApi.listTimeEntries(wId, uId, since.toISOString());
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
		this.unsubscribe?.();
		if (!this.workspaceId) return;
		// W6: ohne Abo bleibt ein zweites Gerät auf dem alten Stand. RLS filtert
		// fremde Zeilen bereits weg (Policy "owner and member").
		this.unsubscribe = subscribeToTable<TimeEntry>('time_entries', this.workspaceId, {
			onInsert: (row) => {
				if (!this.entries.some((e) => e.id === row.id)) this.entries = [row, ...this.entries];
			},
			onUpdate: (row) => {
				this.entries = this.entries.map((e) => (e.id === row.id ? row : e));
			},
			onDelete: ({ id }) => {
				this.entries = this.entries.filter((e) => e.id !== id);
			}
		});
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.entries = [];
		this.loaded = false;
		this.workspaceId = null;
	}

	// ── Lesen ───────────────────────────────────────────────────────────────

	entriesForTask(taskId: string): TimeEntry[] {
		return this.entries
			.filter((e) => e.task_id === taskId)
			.sort((a, b) => b.started_at.localeCompare(a.started_at));
	}

	totalForTask(taskId: string): number {
		return this.entries
			.filter((e) => e.task_id === taskId)
			.reduce((sum, e) => sum + minutesOf(e), 0);
	}

	get totalTodayMin(): number {
		return minutesOnDate(this.entries, toISODate(new Date()));
	}

	get totalWeekMin(): number {
		return minutesThisWeek(this.entries);
	}

	/** Abgeschlossene Fokus-Runden heute — Basis für „lange Pause fällig?". */
	get pomodoroCountToday(): number {
		return pomodorosOnDate(this.entries, toISODate(new Date()));
	}

	// ── Schreiben ───────────────────────────────────────────────────────────

	/**
	 * Einziger Schreibpfad. `ended_at` ist immer `started_at + duration_min`,
	 * damit die Spalte konsistent bleibt.
	 */
	async log(taskId: string | null, minutes: number, opts: LogOptions = {}) {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;
		const rounded = Math.max(1, Math.round(minutes));
		const started = opts.startedAt ?? new Date(Date.now() - rounded * 60000);
		const ended = new Date(started.getTime() + rounded * 60000);
		const entry: TimeEntry = {
			id: crypto.randomUUID(),
			workspace_id: wId,
			user_id: uId,
			task_id: taskId,
			started_at: started.toISOString(),
			ended_at: ended.toISOString(),
			duration_min: rounded,
			source: opts.source ?? 'pomodoro',
			note: opts.note ?? null,
			created_at: new Date().toISOString()
		};
		this.entries = [entry, ...this.entries];
		await outbox.runOrQueue('time_entries', 'insert', entry, () =>
			timeApi.insertTimeEntryRaw(entry)
		);
	}

	/** „Zeit nachtragen" — Datum wird auf 12:00 lokal gelegt (kein Zeitzonen-Rutsch). */
	async addManual(input: TimeEntryInput) {
		const parsed = timeEntryInputSchema.parse(input);
		const [y, m, d] = parsed.date.split('-').map(Number);
		const startedAt = new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0);
		await this.log(parsed.task_id, parsed.minutes, {
			source: 'manual',
			startedAt,
			note: parsed.note
		});
	}

	async remove(id: string) {
		this.entries = this.entries.filter((e) => e.id !== id);
		await outbox.runOrQueue('time_entries', 'delete', { id }, () => timeApi.deleteTimeEntry(id));
	}
}

export const timeTrackingState = new TimeTrackingState();
