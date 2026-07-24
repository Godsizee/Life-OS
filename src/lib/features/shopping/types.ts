export interface ShoppingItem {
  id: string;
  workspace_id: string;
  name: string;
  qty: number;
  unit: string | null;
  category: string | null;
  note: string | null;
  checked: boolean;
  checked_at: string | null;
  position: number;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSettings {
  /** Kategorie-Reihenfolge fürs Einkaufs-„Ladenlayout" (Kategorie-IDs). */
  shopping_category_order?: string[];
}
