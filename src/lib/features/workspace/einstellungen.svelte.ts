import { registriereSpeicher } from '#lib/core/einstellungen.js';
import { outbox } from '#lib/core/outbox.svelte.js';
import { subscribeToTable } from '#lib/core/realtime.js';
import { ladeSicher } from '#lib/core/store-load.js';
import * as workspaceApi from './api';

interface SettingsRow {
	workspace_id: string;
	settings: Record<string, unknown> | null;
}

interface Patch {
	ws: string;
	patch: Record<string, unknown>;
}

/** Haushalts-Einstellungen (Tabelle workspace_settings): flache Schlüssel '<modul>.<name>' bzw. Bestand `shopping_*`. */
class HaushaltState {
	settings = $state<Record<string, unknown>>({});
	loaded = $state(false);
	private workspaceId: string | null = null;
	private unsub: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('workspace_settings', {
			update: (payload) => {
				const p = payload as Patch;
				return workspaceApi.mergeHaushaltSettings(p.ws, p.patch);
			}
		});
		registriereSpeicher('haushalt', {
			lesen: (k) => this.settings[k],
			schreiben: (patch) => this.setSettings(patch)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		const ok = await ladeSicher('Haushalts-Einstellungen', async () => {
			this.settings = await workspaceApi.getHaushaltSettings(workspaceId);
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
		if (!this.workspaceId) return;
		// Remote-Änderungen ersetzen den Stand; eigene stehen bereits optimistisch drin.
		const uebernehmen = (row: SettingsRow) => {
			this.settings = row.settings ?? {};
		};
		this.unsub = subscribeToTable<SettingsRow>('workspace_settings', this.workspaceId, {
			onInsert: uebernehmen,
			onUpdate: uebernehmen
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
		this.settings = {};
		this.loaded = false;
		this.workspaceId = null;
	}

	/** Optimistisch lokal, dann nur der Patch über die Outbox (serverseitig gemergt). */
	async setSettings(patch: Record<string, unknown>): Promise<void> {
		const ws = this.workspaceId;
		if (!ws) return;
		this.settings = { ...this.settings, ...patch };
		await outbox.runOrQueue('workspace_settings', 'update', { ws, patch } satisfies Patch, () =>
			workspaceApi.mergeHaushaltSettings(ws, patch)
		);
	}
}

export const haushaltState = new HaushaltState();
