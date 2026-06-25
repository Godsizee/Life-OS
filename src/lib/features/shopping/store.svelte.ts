import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as shoppingApi from './api';
import { shoppingItemInputSchema, type ShoppingItemInput } from './schema';
import type { ShoppingItem } from './types';

class ShoppingState {
	items = $state<ShoppingItem[]>([]);
	loading = $state(false);
	private workspaceId: string | null = null;
	private unsubscribe: (() => void) | null = null;

	constructor() {
		outbox.registerExecutor('shopping_items', {
			insert: (payload) => shoppingApi.insertRaw(payload as ShoppingItem),
			update: (payload) =>
				shoppingApi.updateRaw(payload as Partial<ShoppingItem> & { id: string }),
			delete: (payload) => shoppingApi.deleteItem((payload as { id: string }).id)
		});
	}

	async load(workspaceId: string) {
		if (this.workspaceId === workspaceId) return;
		this.workspaceId = workspaceId;
		this.loading = true;
		try {
			this.items = await shoppingApi.listItems(workspaceId);
		} finally {
			this.loading = false;
		}
		this.subscribe();
	}

	private subscribe() {
		this.unsubscribe?.();
		if (!this.workspaceId) return;
		this.unsubscribe = subscribeToTable<ShoppingItem>('shopping_items', this.workspaceId, {
			onInsert: (row) => {
				if (!this.items.some((i) => i.id === row.id)) this.items = [...this.items, row];
			},
			onUpdate: (row) => {
				this.items = this.items.map((i) => (i.id === row.id ? row : i));
			},
			onDelete: ({ id }) => {
				this.items = this.items.filter((i) => i.id !== id);
			}
		});
	}

	unload() {
		this.unsubscribe?.();
		this.unsubscribe = null;
		this.items = [];
		this.workspaceId = null;
	}

	async addItem(input: { name: string } & Partial<ShoppingItemInput>) {
		if (!this.workspaceId) throw new Error('Kein Workspace geladen');
		const parsed = shoppingItemInputSchema.parse(input);
		const now = new Date().toISOString();
		const item: ShoppingItem = {
			id: crypto.randomUUID(),
			workspace_id: this.workspaceId,
			name: parsed.name,
			qty: parsed.qty,
			unit: parsed.unit,
			checked: false,
			position: 0,
			added_by: authState.user!.id,
			created_at: now,
			updated_at: now
		};
		this.items = [...this.items, item];
		await outbox.runOrQueue('shopping_items', 'insert', item, () => shoppingApi.insertRaw(item));
	}

	async toggleChecked(id: string) {
		const item = this.items.find((i) => i.id === id);
		if (!item) return;
		const checked = !item.checked;
		const updated_at = new Date().toISOString();
		this.items = this.items.map((i) => (i.id === id ? { ...i, checked, updated_at } : i));
		await outbox.runOrQueue('shopping_items', 'update', { id, checked, updated_at }, () =>
			shoppingApi.updateRaw({ id, checked, updated_at })
		);
	}

	async removeItem(id: string) {
		this.items = this.items.filter((i) => i.id !== id);
		await outbox.runOrQueue('shopping_items', 'delete', { id }, () => shoppingApi.deleteItem(id));
	}

	/** Bulk delete bypasses the outbox - doesn't fit the per-row replay model (like addProject). */
	async clearChecked() {
		if (!this.workspaceId) return;
		this.items = this.items.filter((i) => !i.checked);
		await shoppingApi.deleteChecked(this.workspaceId);
	}
}

export const shoppingState = new ShoppingState();
