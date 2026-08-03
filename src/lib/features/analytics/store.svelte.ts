import { authState } from '$lib/core/auth.svelte';
import { workspaceState } from '$lib/features/workspace/store.svelte';
import * as analyticsApi from './api';
import { computeLifeScore } from './scoring';
import { toISODate } from '$lib/core/date';
import { subscribeToTable } from '$lib/core/realtime';
import { ladeSicher } from '$lib/core/store-load';
import { toastState } from '$lib/core/toast.svelte';

/**
 * Merkt sich, für welchen Kalendertag der Backfill schon lief — je Konto, damit
 * ein Gerätewechsel zwischen zwei Nutzern nicht den falschen Stand erbt.
 * localStorage kann fehlen (Privatmodus): dann läuft der Backfill eben wieder,
 * das ist nur langsamer, nicht falsch.
 */
const MARKER_KEY = 'lifeos:analytics:backfill';

function leseMarker(userId: string): string | null {
	try {
		return localStorage.getItem(`${MARKER_KEY}:${userId}`);
	} catch {
		return null;
	}
}

function setzeMarker(userId: string, tag: string): void {
	try {
		localStorage.setItem(`${MARKER_KEY}:${userId}`, tag);
	} catch {
		// Kein Speicher verfügbar — nächster Start rechnet erneut nach.
	}
}

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

	/** Erneut vom Server laden — Abgleich nach Verbindungsabbruch (core/resync.ts). */
	async reload() {
		this.workspaceId = null;
		await this.load();
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
	 * Rechnet fehlende Tagesscores der letzten `days` Tage nach — ohne das
	 * entstehen Lücken, sobald die App einen Tag lang nicht geöffnet wird.
	 *
	 * Achtung: Nutzt den HEUTIGEN Datenstand (z. B. aktuelle Ziele/Gewichte),
	 * ist also eine Näherung.
	 *
	 * Einmal pro Kalendertag: der Aufruf hing an loadWorkspaceData() und lief
	 * damit bei jedem Kaltstart erneut — für Tage, die längst berechnet sind,
	 * bleibt nur der Lesevorgang, aber die Prüfung selbst kostete jedes Mal bis
	 * zu sieben Round-Trips nacheinander.
	 */
	async backfillScores(days = 7) {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;

		const heute = toISODate(new Date());
		if (leseMarker(uId) === heute) return;

		const offen: string[] = [];
		for (let i = days; i >= 1; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const iso = toISODate(d);
			if (!this.scores.some((s) => s.date === iso)) offen.push(iso);
		}

		if (offen.length > 0) {
			// Parallel statt nacheinander: die Tage sind voneinander unabhängig,
			// sequenziell summierten sich sieben Latenzen auf.
			const ergebnisse = await Promise.allSettled(
				offen.map((iso) => {
					const berechnet = computeLifeScore(iso);
					return analyticsApi.upsertScore(wId, uId, iso, berechnet.total, berechnet.breakdown);
				})
			);

			const neue = ergebnisse
				.filter((r) => r.status === 'fulfilled')
				.map((r) => (r as PromiseFulfilledResult<analyticsApi.DBScoreEntry>).value);
			if (neue.length > 0) {
				this.scores = [...this.scores, ...neue].sort((a, b) => a.date.localeCompare(b.date));
			}

			const fehlgeschlagen = ergebnisse.length - neue.length;
			// Eine Meldung für alle, nicht eine pro Tag — und nicht nur in der Konsole.
			if (fehlgeschlagen > 0) {
				console.error('[Analytics] Backfill unvollständig', ergebnisse);
				toastState.warning(`${fehlgeschlagen} Tage konnten nicht nachberechnet werden`);
				return; // Marker NICHT setzen: der nächste Start versucht es erneut.
			}
		}

		setzeMarker(uId, heute);
	}
}

export const analyticsState = new AnalyticsState();
