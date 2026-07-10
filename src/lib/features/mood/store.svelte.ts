import { authState } from '$lib/core/auth.svelte';
import { toISODate } from '$lib/core/date';
import { workspaceState } from '$lib/features/workspace/store.svelte';
import * as moodApi from './api';
import type { MoodEntry } from './types';

function createMoodState() {
	let entries = $state<MoodEntry[]>([]);
	let loading = $state(false);

	const today = toISODate(new Date());

	const todayEntry = $derived(entries.find((e) => e.date === today) ?? null);

	// 7-Tage-Sparkline
	const weekScores = $derived(() => {
		const days: (number | null)[] = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const key = toISODate(d);
			const entry = entries.find((e) => e.date === key);
			days.push(entry ? entry.score : null);
		}
		return days;
	});

	async function load() {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;
		loading = true;
		try {
			const since = new Date();
			since.setDate(since.getDate() - 30);
			entries = await moodApi.getMonthMoods(wId, uId, toISODate(since));
		} finally {
			loading = false;
		}
	}

	async function save(score: number, note: string | null) {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;
		const entry = await moodApi.upsertMood(wId, uId, today, score, note);
		const idx = entries.findIndex((e) => e.date === today);
		if (idx >= 0) {
			entries = entries.map((e) => (e.date === today ? entry : e));
		} else {
			entries = [...entries, entry];
		}
	}

	function unload() {
		entries = [];
	}

	return {
		get entries() { return entries; },
		get loading() { return loading; },
		get todayEntry() { return todayEntry; },
		get weekScores() { return weekScores; },
		load,
		save,
		unload
	};
}

export const moodState = createMoodState();
