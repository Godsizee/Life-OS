import { authState } from '#lib/core/auth.svelte.js';
import { toISODate } from '#lib/core/date.js';
import { neueId } from '#lib/core/id.js';
import { outbox } from '#lib/core/outbox.svelte.js';
import { seitTagen } from '#lib/core/query.js';
import { subscribeToTable } from '#lib/core/realtime.js';
import { ladeSicher } from '#lib/core/store-load.js';
import * as api from './rituale-api';
import { ersetzeNachDatum, mitPatch } from './rituale-logik';
import type { DayRitual } from './rituale-types';

const FENSTER_TAGE = 60;

class RitualeState {
	rituale = $state<DayRitual[]>([]);
	loaded = $state(false);
	private workspaceId: string | null = null;
	private unsub: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('day_rituals', {
			insert: (payload) => api.upsertRitual(payload as DayRitual),
			update: (payload) => api.upsertRitual(payload as DayRitual)
		});
	}

	/** Eintrag eines Tages. */
	fuer(datum: string): DayRitual | undefined {
		return this.rituale.find((r) => r.date === datum);
	}

	/** Getter statt `$derived`: „heute“ darf nicht beim Laden einfrieren. */
	get heute(): DayRitual | undefined {
		return this.fuer(toISODate(new Date()));
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		const ok = await ladeSicher('Tagesrituale', async () => {
			this.rituale = await api.listRituals(workspaceId, seitTagen(FENSTER_TAGE));
		});
		if (!ok) {
			this.workspaceId = null;
			return;
		}
		this.loaded = true;
		this.subscribe();
	}

	private subscribe() {
		this.unsub?.();
		this.unsub = null;
		const uid = authState.user?.id;
		if (!this.workspaceId || !uid) return;
		// Handler rufen nie emit() auf (Falle F11).
		const uebernehmen = (row: DayRitual) => {
			if (row.user_id === uid) this.rituale = ersetzeNachDatum(this.rituale, row);
		};
		this.unsub = subscribeToTable<DayRitual>('day_rituals', this.workspaceId, {
			onInsert: uebernehmen,
			onUpdate: uebernehmen,
			onDelete: ({ id }) => (this.rituale = this.rituale.filter((r) => r.id !== id))
		});
	}

	/** Abgleich nach Verbindungsabbruch (core/resync.ts). */
	async reload(workspaceId: string) {
		this.workspaceId = null;
		await this.load(workspaceId);
	}

	unload() {
		this.unsub?.();
		this.unsub = null;
		this.rituale = [];
		this.loaded = false;
		this.workspaceId = null;
	}

	private async schreibe(datum: string, patch: Parameters<typeof mitPatch>[2]): Promise<void> {
		const uid = authState.user?.id;
		if (!this.workspaceId || !uid) return;
		const bestehend = this.fuer(datum);
		const row = mitPatch(
			bestehend,
			{ id: neueId(), workspace_id: this.workspaceId, user_id: uid, date: datum },
			patch,
			new Date().toISOString()
		);
		this.rituale = ersetzeNachDatum(this.rituale, row);
		await outbox.runOrQueue('day_rituals', bestehend ? 'update' : 'insert', row, () =>
			api.upsertRitual(row)
		);
	}

	/** „Tag planen“ erledigt: Kapazität und Absicht des Tages festhalten. */
	markiereGeplant(
		datum: string,
		werte: { capacity_min?: number | null; intention?: string | null } = {}
	): Promise<void> {
		return this.schreibe(datum, { ...werte, planned_at: new Date().toISOString() });
	}

	/** „Tag abschließen“ erledigt. */
	markiereAbgeschlossen(datum: string): Promise<void> {
		return this.schreibe(datum, { closed_at: new Date().toISOString() });
	}
}

export const ritualeState = new RitualeState();
