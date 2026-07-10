import { authState } from '$lib/core/auth.svelte';
import { toISODate } from '$lib/core/date';
import { workspaceState } from '$lib/features/workspace/store.svelte';
import * as healthApi from './api';
import type { HealthEntry } from './types';

function createHealthState() {
	let entries = $state<HealthEntry[]>([]);
	let loading = $state(false);

	const today = toISODate(new Date());
	const todayEntry = $derived(entries.find((e) => e.date === today) ?? null);

	async function load() {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;
		loading = true;
		try {
			const since = new Date();
			since.setDate(since.getDate() - 14);
			entries = await healthApi.getRecentHealth(wId, uId, toISODate(since));
		} finally {
			loading = false;
		}
	}

	async function save(payload: {
		weight_kg: number | null;
		sleep_h: number | null;
		water_glasses: number | null;
		energy: number | null;
	}) {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;
		const entry = await healthApi.upsertHealth(wId, uId, { date: today, ...payload });
		const idx = entries.findIndex((e) => e.date === today);
		if (idx >= 0) {
			entries = entries.map((e) => (e.date === today ? entry : e));
		} else {
			entries = [entry, ...entries];
		}
	}

	function unload() {
		entries = [];
	}

	return {
		get entries() { return entries; },
		get loading() { return loading; },
		get todayEntry() { return todayEntry; },
		load,
		save,
		unload
	};
}

export const healthState = createHealthState();
