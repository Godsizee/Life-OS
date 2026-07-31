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
  assignee_id?: string | null;
  list_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KaufStatistik {
	/** Kleingeschriebener Name als Schlüssel. */
	name: string;
	/** Anzeigename in der Schreibweise des letzten Kaufs. */
	label: string;
	category: string | null;
	/** Wie oft insgesamt gekauft. */
	count: number;
	/** ISO-Zeitstempel des letzten Kaufs. */
	last: string;
}

export interface WorkspaceSettings {
  /** Kategorie-Reihenfolge fürs Einkaufs-„Ladenlayout" (Kategorie-IDs). */
  shopping_category_order?: string[];
  /** W10 — überlebt „Verlauf leeren". Max. 60 Einträge, ältestes fällt raus. */
  shopping_stats?: KaufStatistik[];
  /** W10 — Stammartikel, die per Tipp wieder auf die Liste kommen. */
  shopping_staples?: { name: string; category: string | null }[];
  /** W10 — benannte Einkaufslisten. Erste ist die Standardliste. */
  shopping_lists?: { id: string; name: string; icon: string }[];
}
