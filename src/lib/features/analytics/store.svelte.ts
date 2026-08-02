import { authState } from '$lib/core/auth.svelte';
import { workspaceState } from '$lib/features/workspace/store.svelte';
import * as analyticsApi from './api';
import { computeLifeScore } from './scoring';
import { toISODate } from '$lib/core/date';
import { subscribeToTable } from '$lib/core/realtime';
import { ladeSicher } from '$lib/core/store-load';

class AnalyticsState {
	scores = $state<analyticsApi.DBScoreEntry[]>([]);
	loading = $state(false);
	loaded = $state(false);
	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;

	todayScore = $derived.by((): number => {
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

	todayBreakdown = $derived.by(() => {
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
		// Early-Return wie in allen anderen Stores — vorher lud dieser als einziger
		// bei jeder Navigation auf /, /analytics und /timeline komplett neu.
		if (this.workspaceId === wId) return;
		this.workspaceId = wId;
		this.loading = true;
		const ok = await ladeSicher('Analytics', async () => {
			const since = new Date();
			since.setDate(since.getDate() - 365);
			this.scores = await analyticsApi.getRecentScores(wId, uId, toISODate(since));
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
		this.loaded = false;
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

	/**
	 * Rechnet fehlende Tagesscores der letzten `days` Tage nach.
	 * Läuft einmal nach dem Laden; ohne das entstehen Lücken, sobald die App
	 * einen Tag lang nicht geöffnet wird.
	 * 
	 * Achtung: Nutzt den HEUTIGEN Datenstand (z.B. aktuelle Ziele/Gewichte).
	 * Ist also eine Näherung.
	 */
	async backfillScores(days = 7) {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;

		for (let i = days; i >= 1; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const iso = toISODate(d);
			
			if (this.scores.some((s) => s.date === iso)) continue;
			
			try {
				const berechnet = computeLifeScore(iso);
				const saved = await analyticsApi.upsertScore(wId, uId, iso, berechnet.total, berechnet.breakdown);
				this.scores = [...this.scores, saved].sort((a, b) => a.date.localeCompare(b.date));
			} catch (e) {
				console.error(`Fehler beim Backfill für ${iso}:`, e);
			}
		}
	}
}

export const analyticsState = new AnalyticsState();
