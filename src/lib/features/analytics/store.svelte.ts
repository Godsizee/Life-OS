import { authState } from '$lib/core/auth.svelte';
import { workspaceState } from '$lib/features/workspace/store.svelte';
import * as analyticsApi from './api';
import { computeLifeScore } from './scoring';
import { toISODate } from '$lib/core/date';
import { subscribeToTable } from '$lib/core/realtime';

class AnalyticsState {
	scores = $state<analyticsApi.DBScoreEntry[]>([]);
	loading = $state(false);
	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;

	todayScore = $derived((): number => {
		const todayStr = toISODate(new Date());
		const entry = this.scores.find((s) => s.date === todayStr);
		if (entry) return entry.total;
		// Fallback to client-side compute if not yet saved in state
		try {
			return computeLifeScore(todayStr).total;
		} catch {
			return 0;
		}
	});

	todayBreakdown = $derived(() => {
		const todayStr = toISODate(new Date());
		const entry = this.scores.find((s) => s.date === todayStr);
		if (entry) return entry.breakdown;
		try {
			return computeLifeScore(todayStr).breakdown;
		} catch {
			return null;
		}
	});

	async load() {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;
		this.workspaceId = wId;
		this.loading = true;
		try {
			const since = new Date();
			since.setDate(since.getDate() - 30);
			this.scores = await analyticsApi.getRecentScores(wId, uId, toISODate(since));
		} finally {
			this.loading = false;
		}
		this.subscribe();
	}

	private subscribe() {
		this.unsubscribe?.();
		if (!this.workspaceId) return;
		this.unsubscribe = subscribeToTable<analyticsApi.DBScoreEntry>('life_scores', this.workspaceId, {
			onInsert: (row) => {
				if (!this.scores.some((s) => s.id === row.id)) {
					this.scores = [...this.scores, row].sort((a, b) => a.date.localeCompare(b.date));
				}
			},
			onUpdate: (row) => {
				this.scores = this.scores.map((s) => (s.id === row.id ? row : s));
			},
			onDelete: ({ id }) => {
				this.scores = this.scores.filter((s) => s.id !== id);
			}
		});
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.scores = [];
		this.workspaceId = null;
	}

	async saveTodayScore() {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;
		const todayStr = toISODate(new Date());
		const calculated = computeLifeScore(todayStr);

		// Check if we already have it in local state with the exact same values
		const existing = this.scores.find((s) => s.date === todayStr);
		if (existing && existing.total === calculated.total) return;

		try {
			const saved = await analyticsApi.upsertScore(
				wId,
				uId,
				todayStr,
				calculated.total,
				calculated.breakdown
			);
			const idx = this.scores.findIndex((s) => s.date === todayStr);
			if (idx >= 0) {
				this.scores = this.scores.map((s) => (s.date === todayStr ? saved : s));
			} else {
				this.scores = [...this.scores, saved].sort((a, b) => a.date.localeCompare(b.date));
			}
		} catch (err) {
			console.error('Fehler beim Speichern des Life Scores:', err);
		}
	}
}

export const analyticsState = new AnalyticsState();
