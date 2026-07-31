import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import { toISODate } from '$lib/core/date';
import { ladeSicher } from '$lib/core/store-load';
import { workspaceState } from '$lib/features/workspace/store.svelte';
import * as moodApi from './api';
import { cleanActivities } from './activities';
import { moodInputSchema } from './schema';
import type { MoodEntry } from './types';

/** 400 Tage: deckt das laufende Kalenderjahr (Year in Pixels) an jedem Tag ab,
 *  ohne beim Start die ganze Historie zu ziehen. Aeltere Jahre kommen ueber
 *  loadYear() nach. */
const WINDOW_DAYS = 400;

class MoodState {
	entries = $state<MoodEntry[]>([]);
	loading = $state(false);
	loaded = $state(false);
	/** Jahre, die ueber loadYear() bereits nachgeladen wurden. */
	private loadedYears = new Set<number>();
	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;

	constructor() {
		// insert und update laufen beide ueber denselben idempotenten Upsert.
		outbox.registerExecutor('mood_entries', {
			insert: (p) => moodApi.upsertMoodRaw(p as moodApi.MoodUpsert),
			update: (p) => moodApi.upsertMoodRaw(p as moodApi.MoodUpsert),
			delete: (p) => moodApi.deleteMoodEntry((p as { id: string }).id)
		});
	}

	/** Heute — als Funktion, nicht als Konstante: eine ueber Mitternacht offene
	 *  PWA wuerde sonst weiter in den Vortag schreiben. */
	todayKey(): string {
		return toISODate(new Date());
	}

	get todayEntries(): MoodEntry[] {
		return this.entriesForDate(this.todayKey());
	}

	get todayEntry(): MoodEntry | null {
		const list = this.todayEntries;
		return list.length > 0 ? list[list.length - 1] : null;
	}

	entriesForDate(date: string): MoodEntry[] {
		return this.entries.filter((e) => e.date === date).sort((a, b) => a.logged_at.localeCompare(b.logged_at));
	}

	/** 7-Tage-Sparkline (aelteste links). null = kein Eintrag. */
	get weekScores(): (number | null)[] {
		const days: (number | null)[] = [];
		const now = new Date();
		for (let i = 6; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
			const dayEntries = this.entriesForDate(toISODate(d));
			if (dayEntries.length === 0) {
				days.push(null);
			} else {
				const sum = dayEntries.reduce((acc, curr) => acc + curr.score, 0);
				days.push(Math.round(sum / dayEntries.length));
			}
		}
		return days;
	}

	async load() {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;
		if (this.workspaceId === wId) return;
		this.workspaceId = wId;
		this.loading = true;
		const ok = await ladeSicher('Stimmung', async () => {
			const since = new Date();
			since.setDate(since.getDate() - WINDOW_DAYS);
			this.entries = await moodApi.listMoodEntries(wId, uId, toISODate(since));
			this.loadedYears.clear();
		});
		this.loading = false;
		if (!ok) {
			this.workspaceId = null;
			return;
		}
		this.loaded = true;
		this.subscribe();
	}

	/** Ein aelteres Kalenderjahr fuer das Jahresraster nachladen (idempotent). */
	async loadYear(year: number) {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId || this.loadedYears.has(year)) return;
		this.loadedYears.add(year);
		const rows = await moodApi.listMoodEntriesInRange(
			wId,
			uId,
			`${year}-01-01`,
			`${year}-12-31`
		);
		for (const row of rows) this.mergeLocal(row);
	}

	private subscribe() {
		this.unsubscribe?.();
		if (!this.workspaceId) return;
		this.unsubscribe = subscribeToTable<MoodEntry>('mood_entries', this.workspaceId, {
			onInsert: (row) => this.mergeLocal(row),
			onUpdate: (row) => this.mergeLocal(row),
			onDelete: ({ id }) => {
				this.entries = this.entries.filter((e) => e.id !== id);
			}
		});
	}

	private mergeLocal(row: MoodEntry) {
		const rest = this.entries.filter(
			(e) => e.id !== row.id && !(e.date === row.date && e.logged_at === row.logged_at)
		);
		this.entries = [...rest, row].sort(
			(a, b) => a.date.localeCompare(b.date) || a.logged_at.localeCompare(b.logged_at)
		);
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.entries = [];
		this.loadedYears.clear();
		this.loaded = false;
		this.workspaceId = null;
	}

	// ── Schreiben ───────────────────────────────────────────────────────────

	/** Heutigen Eintrag speichern. `activities` ist optional, damit bestehende
	 *  Aufrufer (NLP-Dispatch auf dem Dashboard) unveraendert funktionieren. */
	async save(score: number, note: string | null, activities: string[] = [], loggedAt?: string) {
		await this.saveFor(this.todayKey(), score, note, activities, loggedAt);
	}

	/** Beliebigen Tag speichern (Year in Pixels, Nachtragen). */
	async saveFor(
		date: string,
		score: number,
		note: string | null,
		activities: string[] = [],
		loggedAt?: string
	) {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;

		const parsed = moodInputSchema.safeParse({
			date,
			logged_at: loggedAt,
			score,
			note: note && note.trim() ? note.trim() : null,
			activities: cleanActivities(activities)
		});
		if (!parsed.success) return;

		const time =
			parsed.data.logged_at ||
			(date === this.todayKey() ? new Date().toISOString() : `${date}T12:00:00.000Z`);

		const payload: moodApi.MoodUpsert = {
			workspace_id: wId,
			user_id: uId,
			date: parsed.data.date,
			logged_at: time,
			score: parsed.data.score,
			note: parsed.data.note,
			activities: parsed.data.activities
		};

		const existing = this.entries.find(
			(e) => e.date === parsed.data.date && e.logged_at === time
		);
		const row: MoodEntry = {
			id: existing?.id ?? crypto.randomUUID(),
			workspace_id: wId,
			user_id: uId,
			date: parsed.data.date,
			logged_at: time,
			score: parsed.data.score as MoodEntry['score'],
			note: parsed.data.note,
			activities: parsed.data.activities
		};

		this.mergeLocal(row);

		const saved = await outbox.runOrQueue(
			'mood_entries',
			existing ? 'update' : 'insert',
			payload,
			() => moodApi.upsertMoodRaw(payload)
		);
		if (saved) this.mergeLocal(saved);
	}

	async renameActivity(von: string, nach: string | null) {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;

		const { renameInList } = await import('./activities');
		const betroffen = this.entries.filter((e) => (e.activities ?? []).includes(von));
		for (const e of betroffen) {
			const updatedActivities = renameInList(e.activities ?? [], von, nach);
			const payload: moodApi.MoodUpsert = {
				id: e.id,
				workspace_id: e.workspace_id,
				user_id: e.user_id,
				date: e.date,
				logged_at: e.logged_at,
				score: e.score,
				note: e.note,
				activities: updatedActivities
			};
			this.mergeLocal({ ...e, activities: updatedActivities });
			await outbox.runOrQueue('mood_entries', 'update', payload, () =>
				moodApi.upsertMoodRaw(payload)
			);
		}
	}

	async remove(id: string) {
		this.entries = this.entries.filter((e) => e.id !== id);
		await outbox.runOrQueue('mood_entries', 'delete', { id }, () =>
			moodApi.deleteMoodEntry(id)
		);
	}
}

export const moodState = new MoodState();
