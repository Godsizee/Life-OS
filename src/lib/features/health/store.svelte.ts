import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import { toISODate } from '$lib/core/date';
import { ladeSicher } from '$lib/core/store-load';
import { workspaceState } from '$lib/features/workspace/store.svelte';
import * as healthApi from './api';
import { healthInputSchema } from './schema';
import type { HealthEntry, HealthValues } from './types';

/** 400 Tage: deckt Jahresansicht und "An diesem Tag" ohne Nachladen ab. */
const WINDOW_DAYS = 400;

class HealthState {
	/** Absteigend nach Datum (neueste zuerst) — die Liste auf /health nutzt das direkt. */
	entries = $state<HealthEntry[]>([]);
	loading = $state(false);
	loaded = $state(false);
	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('health_entries', {
			insert: (p) => healthApi.upsertHealthRaw(p as healthApi.HealthUpsert),
			update: (p) => healthApi.upsertHealthRaw(p as healthApi.HealthUpsert),
			delete: (p) => healthApi.deleteHealthEntry((p as { id: string }).id)
		});
	}

	/** Heute — als Funktion, nicht als Konstante (Mitternachts-Fehler, s. Plan §3.5). */
	todayKey(): string {
		return toISODate(new Date());
	}

	get todayEntry(): HealthEntry | null {
		return this.entryForDate(this.todayKey());
	}

	entryForDate(date: string): HealthEntry | null {
		return this.entries.find((e) => e.date === date) ?? null;
	}

	async load() {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;
		if (this.workspaceId === wId) return;
		this.workspaceId = wId;
		this.loading = true;
		const ok = await ladeSicher('Gesundheit', async () => {
			const since = new Date();
			since.setDate(since.getDate() - WINDOW_DAYS);
			this.entries = await healthApi.listHealthEntries(wId, uId, toISODate(since));
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
		this.unsubscribe = subscribeToTable<HealthEntry>('health_entries', this.workspaceId, {
			onInsert: (row) => this.mergeLocal(row),
			onUpdate: (row) => this.mergeLocal(row),
			onDelete: ({ id }) => {
				this.entries = this.entries.filter((e) => e.id !== id);
			}
		});
	}

	/** Merge nach DATUM (optimistische Zeilen tragen eine temporaere UUID). */
	private mergeLocal(row: HealthEntry) {
		const rest = this.entries.filter((e) => e.date !== row.date && e.id !== row.id);
		this.entries = [...rest, row].sort((a, b) => b.date.localeCompare(a.date));
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.entries = [];
		this.loaded = false;
		this.workspaceId = null;
	}

	// ── Schreiben ───────────────────────────────────────────────────────────

	/** Heutige Werte speichern (Signatur wie bisher — Dashboard-Aufrufe bleiben gueltig). */
	async save(values: HealthValues) {
		await this.saveFor(this.todayKey(), values);
	}

	/** Beliebigen Tag speichern (Nachtragen). */
	async saveFor(date: string, values: HealthValues) {
		const wId = workspaceState.workspace?.id;
		const uId = authState.user?.id;
		if (!wId || !uId) return;

		const parsed = healthInputSchema.safeParse({ date, ...values });
		if (!parsed.success) return;

		const payload: healthApi.HealthUpsert = {
			workspace_id: wId,
			user_id: uId,
			date: parsed.data.date,
			weight_kg: parsed.data.weight_kg,
			sleep_h: parsed.data.sleep_h,
			water_ml: parsed.data.water_ml,
			energy: parsed.data.energy
		};

		const existing = this.entryForDate(parsed.data.date);
		this.mergeLocal({
			id: existing?.id ?? crypto.randomUUID(),
			workspace_id: wId,
			user_id: uId,
			date: parsed.data.date,
			weight_kg: parsed.data.weight_kg,
			sleep_h: parsed.data.sleep_h,
			water_ml: parsed.data.water_ml as HealthEntry['water_ml'],
			water_glasses: existing?.water_glasses ?? null,
			energy: parsed.data.energy as HealthEntry['energy']
		});

		const saved = await outbox.runOrQueue(
			'health_entries',
			existing ? 'update' : 'insert',
			payload,
			() => healthApi.upsertHealthRaw(payload)
		);
		if (saved) this.mergeLocal(saved);
	}

	async remove(id: string) {
		this.entries = this.entries.filter((e) => e.id !== id);
		await outbox.runOrQueue('health_entries', 'delete', { id }, () =>
			healthApi.deleteHealthEntry(id)
		);
	}

	/** Wasser um `deltaMl` verändern (auch negativ). Nie unter 0. */
	async addWater(deltaMl: number) {
		const heute = this.todayKey();
		const e = this.entryForDate(heute);
		const aktuell = e ? (e.water_ml ?? 0) : 0;
		await this.saveFor(heute, {
			weight_kg: e?.weight_kg ?? null,
			sleep_h: e?.sleep_h ?? null,
			water_ml: Math.max(0, aktuell + deltaMl),
			energy: e?.energy ?? null
		});
	}
}

export const healthState = new HealthState();
