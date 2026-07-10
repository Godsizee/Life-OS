import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { workspaceState } from '$lib/features/workspace/store.svelte';
import { toISODate } from '$lib/core/date';
import * as timeApi from './api';
import type { TimeEntry, TimeSource } from './types';

class TimeTrackingState {
	entries = $state<TimeEntry[]>([]);
	private workspaceId: string | null = null;

	constructor() {
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
		const since = new Date();
		since.setDate(since.getDate() - 30);
		this.entries = await timeApi.listTimeEntries(wId, uId, since.toISOString());
	}

	unload() {
		this.entries = [];
		this.workspaceId = null;
	}

	async log(taskId: string | null, minutes: number, source: TimeSource = 'pomodoro') {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;
		const now = new Date();
		const started = new Date(now.getTime() - minutes * 60000);
		const entry: TimeEntry = {
			id: crypto.randomUUID(),
			workspace_id: wId,
			user_id: uId,
			task_id: taskId,
			started_at: started.toISOString(),
			ended_at: now.toISOString(),
			duration_min: minutes,
			source,
			created_at: now.toISOString()
		};
		this.entries = [entry, ...this.entries];
		await outbox.runOrQueue('time_entries', 'insert', entry, () =>
			timeApi.insertTimeEntryRaw(entry)
		);
	}

	totalForTask(taskId: string): number {
		return this.entries
			.filter((e) => e.task_id === taskId)
			.reduce((sum, e) => sum + e.duration_min, 0);
	}

	get totalTodayMin(): number {
		const today = toISODate(new Date());
		return this.entries
			.filter((e) => e.started_at.startsWith(today))
			.reduce((sum, e) => sum + e.duration_min, 0);
	}
}

export const timeTrackingState = new TimeTrackingState();
