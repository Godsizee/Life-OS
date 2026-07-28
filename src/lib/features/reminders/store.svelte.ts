import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import { toastState } from '$lib/core/toast.svelte';
import { pushState } from '$lib/core/push.svelte';
import * as remindersApi from './api';
import { reminderInputSchema, type ReminderInput } from './schema';
import { firstFutureOccurrence, isDue, isOnDay, reminderAtFromAnchor } from './schedule';
import type { Reminder, ReminderEntityType } from './types';

/** Wie oft der In-App-Fallback prüft (ms). */
const TICK_MS = 60_000;

class RemindersState {
	reminders = $state<Reminder[]>([]);
	loading = $state(false);
	private workspaceId: string | null = null;
	private unsub: (() => void) | null = null;
	private timer: ReturnType<typeof setInterval> | null = null;
	/** In dieser Session bereits in-app gemeldet (verhindert Toast-Schleifen). */
	private announced = new Set<string>();

	constructor() {
		outbox.registerExecutor('reminders', {
			insert: (p) => remindersApi.insertRaw(p as Reminder),
			update: (p) => remindersApi.updateRaw(p as Partial<Reminder> & { id: string }),
			delete: (p) => remindersApi.deleteReminder((p as { id: string }).id)
		});
	}

	/** Nur die eigenen Erinnerungen — Empfänger ist immer genau ein Nutzer. */
	get mine(): Reminder[] {
		const uid = authState.user?.id;
		return uid ? this.reminders.filter((r) => r.user_id === uid) : [];
	}

	/** Aktive eigene Erinnerungen für heute (Dashboard-Chip). */
	get todayCount(): number {
		const today = new Date();
		return this.mine.filter((r) => isOnDay(r, today)).length;
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		try {
			this.reminders = await remindersApi.listReminders(workspaceId);
		} finally {
			this.loading = false;
		}
		this.subscribe();
		this.startTicker();
	}

	private subscribe() {
		this.unsub?.();
		if (!this.workspaceId) return;
		this.unsub = subscribeToTable<Reminder>('reminders', this.workspaceId, {
			onInsert: (row) => {
				if (!this.reminders.some((r) => r.id === row.id)) this.reminders = [...this.reminders, row];
			},
			onUpdate: (row) => {
				this.reminders = this.reminders.map((r) => (r.id === row.id ? row : r));
			},
			onDelete: ({ id }) => {
				this.reminders = this.reminders.filter((r) => r.id !== id);
			}
		});
	}

	/**
	 * In-App-Fallback: Solange Push NICHT abonniert ist, meldet die geöffnete App
	 * fällige Erinnerungen selbst. Mit Push-Abo bleibt es still — sonst käme die
	 * Meldung doppelt.
	 */
	private startTicker() {
		if (typeof window === 'undefined' || this.timer) return;
		this.timer = setInterval(() => this.checkDue(), TICK_MS);
		this.checkDue();
	}

	private checkDue() {
		if (pushState.subscribed) return;
		if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
		for (const r of this.mine) {
			if (!isDue(r) || this.announced.has(r.id)) continue;
			this.announced.add(r.id);
			toastState.info(`🔔 ${r.title}`);
		}
	}

	unload() {
		this.unsub?.();
		this.unsub = null;
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
		this.announced.clear();
		this.reminders = [];
		this.workspaceId = null;
	}

	/** Eigene Erinnerungen einer Entität (für ReminderSection). */
	forEntity(type: ReminderEntityType, id: string | null): Reminder[] {
		return this.mine
			.filter((r) => r.entity_type === type && r.entity_id === id)
			.sort((a, b) => a.remind_at.localeCompare(b.remind_at));
	}

	async add(input: ReminderInput) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const userId = authState.user?.id;
		if (!userId) throw new Error('Nicht angemeldet');
		const parsed = reminderInputSchema.parse(input);
		const now = new Date().toISOString();
		const reminder: Reminder = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			user_id: userId,
			entity_type: parsed.entity_type,
			entity_id: parsed.entity_id,
			title: parsed.title,
			body: parsed.body,
			url: parsed.url,
			// Serien immer in der Zukunft starten lassen.
			remind_at: firstFutureOccurrence(parsed.remind_at, parsed.rrule),
			rrule: parsed.rrule,
			offset_minutes: parsed.offset_minutes,
			active: true,
			last_sent_at: null,
			created_by: userId,
			created_at: now,
			updated_at: now
		};
		this.reminders = [...this.reminders, reminder];
		await outbox.runOrQueue('reminders', 'insert', reminder, () =>
			remindersApi.insertRaw(reminder)
		);
	}

	async remove(id: string) {
		this.reminders = this.reminders.filter((r) => r.id !== id);
		await outbox.runOrQueue('reminders', 'delete', { id }, () => remindersApi.deleteReminder(id));
	}

	/** Alle Erinnerungen einer Entität löschen (Entität gelöscht). */
	async removeFor(type: ReminderEntityType, id: string) {
		for (const r of this.reminders.filter((x) => x.entity_type === type && x.entity_id === id)) {
			await this.remove(r.id);
		}
	}

	/** Stillegen statt löschen (Aufgabe erledigt). */
	async deactivateFor(type: ReminderEntityType, id: string) {
		const updated_at = new Date().toISOString();
		for (const r of this.reminders.filter(
			(x) => x.entity_type === type && x.entity_id === id && x.active && !x.rrule
		)) {
			this.reminders = this.reminders.map((x) =>
				x.id === r.id ? { ...x, active: false, updated_at } : x
			);
			await outbox.runOrQueue('reminders', 'update', { id: r.id, active: false, updated_at }, () =>
				remindersApi.updateRaw({ id: r.id, active: false, updated_at })
			);
		}
	}

	/**
	 * Ankerzeit der Entität hat sich geändert (Termin verschoben, Fälligkeit
	 * geändert) → alle Offset-Erinnerungen mitziehen. Erinnerungen ohne Anker
	 * (offset_minutes === 0 bei Modus 'datetime'/'time') bleiben unangetastet.
	 */
	async syncAnchor(type: ReminderEntityType, id: string, anchorIso: string | null) {
		const updated_at = new Date().toISOString();
		for (const r of this.reminders.filter(
			(x) => x.entity_type === type && x.entity_id === id && x.offset_minutes > 0
		)) {
			if (!anchorIso) {
				await this.remove(r.id);
				continue;
			}
			const remind_at = reminderAtFromAnchor(anchorIso, r.offset_minutes);
			if (remind_at === r.remind_at) continue;
			this.reminders = this.reminders.map((x) =>
				x.id === r.id ? { ...x, remind_at, active: true, updated_at } : x
			);
			await outbox.runOrQueue(
				'reminders',
				'update',
				{ id: r.id, remind_at, active: true, updated_at },
				() => remindersApi.updateRaw({ id: r.id, remind_at, active: true, updated_at })
			);
		}
	}
}

export const remindersState = new RemindersState();
