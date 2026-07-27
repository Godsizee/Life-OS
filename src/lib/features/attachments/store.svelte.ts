import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as attachmentsApi from './api';
import {
	buildStoragePath,
	isAcceptedMime,
	MAX_UPLOAD_BYTES,
	prepareImage,
	formatBytes
} from './image';
import type { Attachment, AttachmentEntityType } from './types';

/** Signierte URLs werden erneuert, bevor sie ablaufen. */
const RENEW_BEFORE_MS = 5 * 60 * 1000;

class AttachmentsState {
	items = $state<Attachment[]>([]);
	loading = $state(false);
	/** storage_path -> signierte URL. */
	urls = $state<Record<string, string>>({});
	/** attachment.id -> Object-URL des lokalen Blobs (optimistische/Offline-Vorschau). */
	previews = $state<Record<string, string>>({});

	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;
	private expiry = new Map<string, number>();
	private inFlight = new Set<string>();

	constructor() {
		outbox.registerExecutor('attachments', {
			insert: async (payload) => {
				const { row, blob } = payload as { row: Attachment; blob: Blob };
				await attachmentsApi.upsertAttachmentRaw(row);
				await attachmentsApi.uploadObject(row.storage_path, blob, row.mime_type);
			},
			delete: async (payload) => {
				const { id, storage_path } = payload as { id: string; storage_path: string };
				await attachmentsApi.deleteObject(storage_path);
				await attachmentsApi.deleteAttachmentRow(id);
			}
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		try {
			this.items = await attachmentsApi.listAttachments(workspaceId);
		} finally {
			this.loading = false;
		}
		this.subscribe();
	}

	private subscribe() {
		this.unsubscribe?.();
		if (!this.workspaceId) return;
		this.unsubscribe = subscribeToTable<Attachment>('attachments', this.workspaceId, {
			onInsert: (row) => {
				if (!this.items.some((a) => a.id === row.id)) this.items = [...this.items, row];
			},
			onDelete: ({ id }) => {
				this.items = this.items.filter((a) => a.id !== id);
			}
		});
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		for (const url of Object.values(this.previews)) URL.revokeObjectURL(url);
		this.previews = {};
		this.urls = {};
		this.expiry.clear();
		this.items = [];
		this.workspaceId = null;
	}

	forEntity(entityType: AttachmentEntityType, entityId: string): Attachment[] {
		return this.items.filter((a) => a.entity_type === entityType && a.entity_id === entityId);
	}

	countFor(entityType: AttachmentEntityType, entityId: string): number {
		return this.forEntity(entityType, entityId).length;
	}

	/** Bild-Quelle: lokaler Blob (falls vorhanden) vor signierter URL. */
	srcFor(attachment: Attachment): string | null {
		return this.previews[attachment.id] ?? this.urls[attachment.storage_path] ?? null;
	}

	/** Besorgt fehlende/ablaufende signierte URLs gebuendelt. Offline: stiller No-op. */
	async ensureUrls(list: Attachment[]) {
		const now = Date.now();
		const missing = list
			.filter((a) => !this.previews[a.id])
			.map((a) => a.storage_path)
			.filter((path) => !this.inFlight.has(path))
			.filter((path) => !this.urls[path] || (this.expiry.get(path) ?? 0) < now + RENEW_BEFORE_MS);
		if (missing.length === 0) return;

		missing.forEach((path) => this.inFlight.add(path));
		try {
			const signed = await attachmentsApi.createSignedUrls([...new Set(missing)]);
			this.urls = { ...this.urls, ...signed };
			const expiresAt = now + attachmentsApi.SIGNED_URL_TTL_SECONDS * 1000;
			for (const path of Object.keys(signed)) this.expiry.set(path, expiresAt);
		} catch {
			// Ohne Netz bleibt die Vorschau leer — kein Absturz, kein Toast-Spam.
		} finally {
			missing.forEach((path) => this.inFlight.delete(path));
		}
	}

	/**
	 * Bild anhaengen. Wirft mit sprechender Meldung, wenn Typ/Groesse nicht passen —
	 * so landet nichts Unzustellbares in der Outbox.
	 */
	async add(entityType: AttachmentEntityType, entityId: string, file: File): Promise<void> {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const userId = authState.user?.id;
		if (!userId) throw new Error('Nicht angemeldet');
		if (!isAcceptedMime(file.type)) throw new Error('Nur JPG, PNG, WebP oder GIF');

		const prepared = await prepareImage(file);
		if (prepared.blob.size > MAX_UPLOAD_BYTES) {
			throw new Error(`Bild zu groß (${formatBytes(prepared.blob.size)}, max. 8 MB)`);
		}

		const row: Attachment = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			entity_type: entityType,
			entity_id: entityId,
			storage_path: buildStoragePath(this.workspaceId, entityType, entityId, prepared.mime),
			mime_type: prepared.mime,
			size_bytes: prepared.blob.size,
			width: prepared.width || null,
			height: prepared.height || null,
			created_by: userId,
			created_at: new Date().toISOString()
		};

		this.items = [...this.items, row];
		this.previews = { ...this.previews, [row.id]: URL.createObjectURL(prepared.blob) };

		// Reihenfolge: Zeile zuerst, dann Objekt (Storage-SELECT-Policy braucht die Zeile).
		await outbox.runOrQueue('attachments', 'insert', { row, blob: prepared.blob }, async () => {
			await attachmentsApi.upsertAttachmentRaw(row);
			await attachmentsApi.uploadObject(row.storage_path, prepared.blob, row.mime_type);
		});
	}

	async remove(id: string) {
		const found = this.items.find((a) => a.id === id);
		if (!found) return;
		this.items = this.items.filter((a) => a.id !== id);

		const preview = this.previews[id];
		if (preview) {
			URL.revokeObjectURL(preview);
			const next = { ...this.previews };
			delete next[id];
			this.previews = next;
		}

		// Reihenfolge: Objekt zuerst, dann Zeile (Storage-DELETE-Policy braucht die Zeile).
		await outbox.runOrQueue(
			'attachments',
			'delete',
			{ id, storage_path: found.storage_path },
			async () => {
				await attachmentsApi.deleteObject(found.storage_path);
				await attachmentsApi.deleteAttachmentRow(id);
			}
		);
	}

	/** Aufraeumen, wenn die Ziel-Entitaet geloescht wird (es gibt keinen FK-Cascade). */
	async removeForEntity(entityType: AttachmentEntityType, entityId: string) {
		for (const a of this.forEntity(entityType, entityId)) await this.remove(a.id);
	}
}

export const attachmentsState = new AttachmentsState();
