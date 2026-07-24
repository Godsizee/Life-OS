// W2 Einkauf — Kategorie-Katalog + reine Gruppierungs-/Vorschlagslogik.
// KEIN lucide-Import hier (Node-Test-Umgebung) — Icons stehen in category-icons.ts.
import type { ShoppingItem } from './types';

export const CATEGORY_IDS = [
  'produce', 'bakery', 'dairy', 'meat', 'frozen', 'pantry',
  'snacks', 'drinks', 'household', 'care', 'other'
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export const CATEGORY_LABELS: Record<string, string> = {
  produce: 'Obst & Gemüse',
  bakery: 'Backwaren',
  dairy: 'Kühlregal',
  meat: 'Fleisch & Fisch',
  frozen: 'Tiefkühl',
  pantry: 'Vorrat',
  snacks: 'Snacks & Süßes',
  drinks: 'Getränke',
  household: 'Haushalt',
  care: 'Drogerie & Pflege',
  other: 'Sonstiges'
};

/** Standard-Reihenfolge = typischer Ladenrundgang; pro Workspace überschreibbar. */
export const DEFAULT_CATEGORY_ORDER: string[] = [...CATEGORY_IDS];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  produce: ['apfel', 'äpfel', 'banane', 'tomate', 'gurke', 'salat', 'zwiebel', 'kartoffel', 'karotte', 'möhre', 'paprika', 'zitrone', 'orange', 'avocado', 'knoblauch', 'pilz', 'beere', 'trauben', 'spinat', 'brokkoli', 'obst', 'gemüse'],
  bakery: ['brot', 'brötchen', 'semmel', 'baguette', 'croissant', 'kuchen', 'toast', 'brezel', 'gebäck'],
  dairy: ['milch', 'käse', 'butter', 'joghurt', 'quark', 'sahne', 'eier', 'frischkäse', 'margarine', 'pudding'],
  meat: ['fleisch', 'hähnchen', 'hühnchen', 'rind', 'schwein', 'hack', 'wurst', 'schinken', 'fisch', 'lachs', 'thunfisch', 'salami', 'speck'],
  frozen: ['tiefkühl', 'tiefkühlpizza', 'pommes', 'fischstäbchen', 'speiseeis'],
  pantry: ['nudeln', 'pasta', 'spaghetti', 'reis', 'mehl', 'zucker', 'salz', 'öl', 'essig', 'konserve', 'soße', 'sauce', 'tomatenmark', 'linsen', 'bohnen', 'müsli', 'haferflocken', 'honig', 'marmelade', 'gewürz'],
  snacks: ['chips', 'schokolade', 'keks', 'kekse', 'süßigkeit', 'riegel', 'nüsse', 'popcorn', 'gummibär'],
  drinks: ['wasser', 'saft', 'cola', 'limo', 'limonade', 'bier', 'wein', 'kaffee', 'tee', 'sprudel', 'getränk', 'sekt'],
  household: ['klopapier', 'toilettenpapier', 'küchenrolle', 'spülmittel', 'waschmittel', 'müllbeutel', 'reiniger', 'schwamm', 'alufolie', 'frischhaltefolie', 'kerze', 'batterie'],
  care: ['shampoo', 'duschgel', 'zahnpasta', 'zahnbürste', 'seife', 'deo', 'creme', 'windel', 'tampon', 'rasier', 'watte', 'pflaster']
};

/** Heuristische Kategorie-Erkennung per Stichwort (Substring, erste Treffer-Kategorie
 *  in Katalog-Reihenfolge). Fallback: 'other'. */
export function guessCategory(name: string): string {
  const lower = name.trim().toLowerCase();
  if (!lower) return 'other';
  for (const id of CATEGORY_IDS) {
    const kws = CATEGORY_KEYWORDS[id];
    if (kws && kws.some((kw) => lower.includes(kw))) return id;
  }
  return 'other';
}

/** Gespeicherte Reihenfolge (nur bekannte IDs) + fehlende Katalog-IDs hinten angehängt. */
export function orderedCategoryIds(order: string[] | undefined): string[] {
  const catalog = CATEGORY_IDS as readonly string[];
  const known = (order ?? []).filter((id) => catalog.includes(id));
  const missing = CATEGORY_IDS.filter((id) => !known.includes(id));
  return [...known, ...missing];
}

const byPosition = (a: ShoppingItem, b: ShoppingItem) =>
  a.position - b.position || a.created_at.localeCompare(b.created_at);

export interface CategoryGroup {
  categoryId: string;
  items: ShoppingItem[];
}

/** Gruppiert Items nach Kategorie in gegebener Reihenfolge; leere Kategorien entfallen. */
export function groupByCategory(items: ShoppingItem[], order: string[] | undefined): CategoryGroup[] {
  const ids = orderedCategoryIds(order);
  const known = new Set(ids);
  const byCat = new Map<string, ShoppingItem[]>();
  for (const it of items) {
    const cat = it.category && known.has(it.category) ? it.category : 'other';
    const arr = byCat.get(cat) ?? [];
    arr.push(it);
    byCat.set(cat, arr);
  }
  return ids
    .filter((id) => byCat.has(id))
    .map((id) => ({ categoryId: id, items: byCat.get(id)!.slice().sort(byPosition) }));
}

export interface Suggestion {
  name: string;
  category: string | null;
}

/** „Zuletzt gekauft": eindeutige Namen abgehakter Items (nach checked_at absteigend),
 *  ohne Namen, die bereits offen auf der Liste stehen. */
export function recentlyBought(items: ShoppingItem[], limit = 8): Suggestion[] {
  const active = new Set(items.filter((i) => !i.checked).map((i) => i.name.toLowerCase()));
  const seen = new Set<string>();
  return items
    .filter((i) => i.checked && i.checked_at)
    .sort((a, b) => (a.checked_at! < b.checked_at! ? 1 : a.checked_at! > b.checked_at! ? -1 : 0))
    .filter((i) => {
      const key = i.name.toLowerCase();
      if (active.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((i) => ({ name: i.name, category: i.category }));
}
