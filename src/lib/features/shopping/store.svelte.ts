import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import * as shoppingApi from './api';
import { shoppingItemInputSchema, type ShoppingItemInput } from './schema';
import type { ShoppingItem, WorkspaceSettings } from './types';
import { guessCategory, orderedCategoryIds, DEFAULT_CATEGORY_ORDER } from './categories';

interface WorkspaceSettingsRow {
  workspace_id: string;
  settings: WorkspaceSettings;
  updated_at: string;
}

class ShoppingState {
  items = $state<ShoppingItem[]>([]);
  settings = $state<WorkspaceSettings>({});
  loading = $state(false);
  private workspaceId: string | null = null;
  private unsubs: (() => void)[] = [];

  /** Kategorie-Reihenfolge inkl. neu hinzugekommener Katalog-Kategorien. */
  categoryOrder = $derived(
    orderedCategoryIds(this.settings.shopping_category_order ?? DEFAULT_CATEGORY_ORDER)
  );

  constructor() {
    outbox.registerExecutor('shopping_items', {
      insert: (payload) => shoppingApi.insertRaw(payload as ShoppingItem),
      update: (payload) => shoppingApi.updateRaw(payload as Partial<ShoppingItem> & { id: string }),
      delete: (payload) => shoppingApi.deleteItem((payload as { id: string }).id)
    });
  }

  async load(workspaceId: string) {
    if (this.workspaceId === workspaceId) return;
    this.workspaceId = workspaceId;
    this.loading = true;
    try {
      [this.items, this.settings] = await Promise.all([
        shoppingApi.listItems(workspaceId),
        shoppingApi.getWorkspaceSettings(workspaceId)
      ]);
    } finally {
      this.loading = false;
    }
    this.subscribe();
  }

  private subscribe() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    if (!this.workspaceId) return;
    this.unsubs.push(
      subscribeToTable<ShoppingItem>('shopping_items', this.workspaceId, {
        onInsert: (row) => {
          if (!this.items.some((i) => i.id === row.id)) this.items = [...this.items, row];
        },
        onUpdate: (row) => {
          this.items = this.items.map((i) => (i.id === row.id ? row : i));
        },
        onDelete: ({ id }) => {
          this.items = this.items.filter((i) => i.id !== id);
        }
      })
    );
    this.unsubs.push(
      subscribeToTable<WorkspaceSettingsRow>('workspace_settings', this.workspaceId, {
        onInsert: (row) => {
          this.settings = row.settings ?? {};
        },
        onUpdate: (row) => {
          this.settings = row.settings ?? {};
        }
      })
    );
  }

  unload() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.items = [];
    this.settings = {};
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
      category: parsed.category ?? guessCategory(parsed.name),
      note: parsed.note,
      checked: false,
      checked_at: null,
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
    const checked_at = checked ? updated_at : null;
    this.items = this.items.map((i) => (i.id === id ? { ...i, checked, checked_at, updated_at } : i));
    await outbox.runOrQueue('shopping_items', 'update', { id, checked, checked_at, updated_at }, () =>
      shoppingApi.updateRaw({ id, checked, checked_at, updated_at })
    );
  }

  async updateItem(
    id: string,
    patch: Partial<Pick<ShoppingItem, 'name' | 'qty' | 'unit' | 'category' | 'note'>>
  ) {
    const updated_at = new Date().toISOString();
    this.items = this.items.map((i) => (i.id === id ? { ...i, ...patch, updated_at } : i));
    await outbox.runOrQueue('shopping_items', 'update', { id, ...patch, updated_at }, () =>
      shoppingApi.updateRaw({ id, ...patch, updated_at })
    );
  }

  async removeItem(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    await outbox.runOrQueue('shopping_items', 'delete', { id }, () => shoppingApi.deleteItem(id));
  }

  /** „Verlauf leeren": abgehakte Items endgültig entfernen (leert auch die Vorschläge).
   *  Bulk-Delete ohne Outbox (passt nicht ins Per-Row-Replay-Modell, wie bisher). */
  async clearChecked() {
    if (!this.workspaceId) return;
    this.items = this.items.filter((i) => !i.checked);
    await shoppingApi.deleteChecked(this.workspaceId);
  }

  async setCategoryOrder(order: string[]) {
    if (!this.workspaceId) return;
    this.settings = { ...this.settings, shopping_category_order: order };
    await shoppingApi.upsertWorkspaceSettings(this.workspaceId, this.settings);
  }
}

export const shoppingState = new ShoppingState();
