import { neueId } from '$lib/core/id';
import { authState } from '$lib/core/auth.svelte';
import { outbox } from '$lib/core/outbox.svelte';
import { subscribeToTable } from '$lib/core/realtime';
import { ladeSicher } from '$lib/core/store-load';
import { loeschenMitUndo } from '$lib/core/undo';
import * as shoppingApi from './api';
import { shoppingItemInputSchema, type ShoppingItemInput } from './schema';
import type { ShoppingItem, WorkspaceSettings } from './types';
import { guessCategoryWithHistory, orderedCategoryIds, DEFAULT_CATEGORY_ORDER, recordPurchase } from './categories';

interface WorkspaceSettingsRow {
  workspace_id: string;
  settings: WorkspaceSettings;
  updated_at: string;
}

class ShoppingState {
  items = $state<ShoppingItem[]>([]);
  settings = $state<WorkspaceSettings>({});
  loading = $state(false);
  loaded = $state(false);
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
    const ok = await ladeSicher('Einkaufsliste', async () => {
      [this.items, this.settings] = await Promise.all([
        shoppingApi.listItems(workspaceId),
        shoppingApi.getWorkspaceSettings(workspaceId)
      ]);
    });
    this.loading = false;
    
    // Auto-Cleanup älter als 30 Tage
    if (this.items.length > 0) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const tooOld = this.items.filter((i) => i.checked && i.checked_at && i.checked_at < thirtyDaysAgo);
      if (tooOld.length > 0) {
        this.items = this.items.filter((i) => !tooOld.some((o) => o.id === i.id));
        // Still remove from backend, ignoring failures
        Promise.all(tooOld.map((o) => shoppingApi.deleteItem(o.id))).catch(console.error);
      }
    }
    if (!ok) {
      this.workspaceId = null;
      return;
    }
    this.loaded = true;
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

  /** Erneut vom Server laden — Abgleich nach Verbindungsabbruch (core/resync.ts). */
  async reload(workspaceId: string) {
    this.workspaceId = null;
    await this.load(workspaceId);
  }

  unload() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.items = [];
    this.settings = {};
    this.loaded = false;
    this.workspaceId = null;
  }

  async addItem(input: { name: string } & Partial<ShoppingItemInput>) {
    if (!this.workspaceId) throw new Error('Kein Workspace geladen');
    const parsed = shoppingItemInputSchema.parse(input);
    const now = new Date().toISOString();
    const item: ShoppingItem = {
      id: neueId(),
      workspace_id: this.workspaceId,
      name: parsed.name,
      qty: parsed.qty,
      unit: parsed.unit,
      category: parsed.category ?? guessCategoryWithHistory(parsed.name, this.settings.shopping_stats),
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
    
    if (checked && this.workspaceId) {
      this.settings = {
        ...this.settings,
        shopping_stats: recordPurchase(this.settings.shopping_stats, { ...item, checked_at })
      };
      await shoppingApi.upsertWorkspaceSettings(this.workspaceId, this.settings);
    }
    
    await outbox.runOrQueue('shopping_items', 'update', { id, checked, checked_at, updated_at }, () =>
      shoppingApi.updateRaw({ id, checked, checked_at, updated_at })
    );
  }

  async updateItem(
    id: string,
    patch: Partial<Pick<ShoppingItem, 'name' | 'qty' | 'unit' | 'category' | 'note' | 'list_id'>>
  ) {
    const updated_at = new Date().toISOString();
    const item = this.items.find((i) => i.id === id);
    this.items = this.items.map((i) => (i.id === id ? { ...i, ...patch, updated_at } : i));

    if (item && patch.category && patch.category !== item.category && this.workspaceId) {
       // Wenn die Kategorie manuell korrigiert wurde, korrigieren wir auch die Statistik
       this.settings = {
         ...this.settings,
         shopping_stats: recordPurchase(this.settings.shopping_stats, { 
             name: patch.name ?? item.name, 
             category: patch.category, 
             checked_at: item.checked_at 
         })
       };
       await shoppingApi.upsertWorkspaceSettings(this.workspaceId, this.settings);
    }

    await outbox.runOrQueue('shopping_items', 'update', { id, ...patch, updated_at }, () =>
      shoppingApi.updateRaw({ id, ...patch, updated_at })
    );
  }

  async setAssignee(id: string, assignee_id: string | null) {
    const updated_at = new Date().toISOString();
    this.items = this.items.map((i) => (i.id === id ? { ...i, assignee_id, updated_at } : i));
    await outbox.runOrQueue('shopping_items', 'update', { id, assignee_id, updated_at }, () =>
      shoppingApi.updateRaw({ id, assignee_id, updated_at })
    );
  }

  async toggleStaple(name: string, category: string | null, isStaple: boolean) {
    if (!this.workspaceId) return;
    const key = name.trim().toLowerCase();
    let staples = this.settings.shopping_staples ?? [];
    if (isStaple) {
       if (!staples.some((s) => s.name.toLowerCase() === key)) {
           staples = [...staples, { name: name.trim(), category }];
       }
    } else {
       staples = staples.filter((s) => s.name.toLowerCase() !== key);
    }
    this.settings = { ...this.settings, shopping_staples: staples };
    await shoppingApi.upsertWorkspaceSettings(this.workspaceId, this.settings);
  }

  async removeItem(id: string) {
    this.items = this.items.filter((i) => i.id !== id);
    await outbox.runOrQueue('shopping_items', 'delete', { id }, () => shoppingApi.deleteItem(id));
  }

  /** Löschen mit Rücknahmefenster — für die Wischgeste. Siehe core/undo.ts. */
  removeItemWithUndo(id: string) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    loeschenMitUndo({
      text: `„${item.name}" gelöscht`,
      ausblenden: () => (this.items = this.items.filter((i) => i.id !== id)),
      wiederherstellen: () => {
        if (!this.items.some((i) => i.id === id)) this.items = [...this.items, item];
      },
      festschreiben: () =>
        outbox.runOrQueue('shopping_items', 'delete', { id }, () => shoppingApi.deleteItem(id))
    });
  }

  /** „Abgehakte aufräumen": abgehakte Items endgültig entfernen. Vorschläge (Statistik) bleiben erhalten.
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

  async setLists(lists: { id: string; name: string; icon: string }[]) {
    if (!this.workspaceId) return;
    this.settings = { ...this.settings, shopping_lists: lists };
    await shoppingApi.upsertWorkspaceSettings(this.workspaceId, this.settings);
  }
}

export const shoppingState = new ShoppingState();
