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

	get todayEntry(): MoodEntry | null {
		return this.entryForDate(this.todayKey());
	}

	entryForDate(date: string): MoodEntry | null {
		return this.entries.find((e) => e.date === date) ?? null;
	}

	/** 7-Tage-Sparkline (aelteste links). null = kein Eintrag. */
	get weekScores(): (number | null)[] {
		const days: (number | null)[] = [];
		const now = new Date();
		for (let i = 6; i >= 0; i--) {
			const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
			days.push(this.entryForDate(toISODate(d))?.score ?? null);
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

	/** Merge nach DATUM, nicht nach id: ein optimistisch angelegter Eintrag traegt
	 *  bis zur Server-Antwort eine temporaere UUID. Ohne diese Dedupe-Regel
	 *  stuenden nach dem Realtime-Event zwei Zeilen fuer denselben Tag im State. */
	private mergeLocal(row: MoodEntry) {
		const rest = this.entries.filter((e) => e.date !== row.date && e.id !== row.id);
		this.entries = [...rest, row].sort((a, b) => a.date.localeCompare(b.date));
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
	async save(score: number, note: string | null, activities: string[] = []) {
		await this.saveFor(this.todayKey(), score, note, activities);
	}

	/** Beliebigen Tag speichern (Year in Pixels, Nachtragen). */
	async saveFor(date: string, score: number, note: string | null, activities: string[] = []) {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;

		const parsed = moodInputSchema.safeParse({
			date,
			score,
			note: note && note.trim() ? note.trim() : null,
			activities: cleanActivities(activities)
		});
		if (!parsed.success) return;

		const payload: moodApi.MoodUpsert = {
			workspace_id: wId,
			user_id: uId,
			date: parsed.data.date,
			score: parsed.data.score,
			note: parsed.data.note,
			activities: parsed.data.activities
		};

		// Optimistisch: bestehende id behalten, sonst temporaere UUID.
		const existing = this.entryForDate(parsed.data.date);
		this.mergeLocal({
			id: existing?.id ?? crypto.randomUUID(),
			workspace_id: wId,
			user_id: uId,
			date: parsed.data.date,
			score: parsed.data.score as MoodEntry['score'],
			note: parsed.data.note,
			activities: parsed.data.activities
		});

		const saved = await outbox.runOrQueue(
			'mood_entries',
			existing ? 'update' : 'insert',
			payload,
			() => moodApi.upsertMoodRaw(payload)
		);
		// Online: die echte Server-Zeile (inkl. id) ersetzt die optimistische.
		if (saved) this.mergeLocal(saved);
	}

	async remove(id: string) {
		this.entries = this.entries.filter((e) => e.id !== id);
		await outbox.runOrQueue('mood_entries', 'delete', { id }, () =>
			moodApi.deleteMoodEntry(id)
		);
	}
}

export const moodState = new MoodState();
