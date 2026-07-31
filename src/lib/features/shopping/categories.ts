// W2 Einkauf — Kategorie-Katalog + reine Gruppierungs-/Vorschlagslogik.
// KEIN lucide-Import hier (Node-Test-Umgebung) — Icons stehen in category-icons.ts.
import type { ShoppingItem, KaufStatistik } from './types';

export const UNITS = ['Stk', 'g', 'kg', 'ml', 'l', 'Pack', 'Dose', 'Flasche', 'Bund', 'Glas'] as const;
export type Unit = (typeof UNITS)[number];

const UNIT_ALIASES: Record<string, Unit> = {
	'stück': 'Stk', 'stueck': 'Stk', 'st': 'Stk', 'st.': 'Stk', 'x': 'Stk',
	'gramm': 'g', 'kilo': 'kg', 'kilogramm': 'kg',
	'milliliter': 'ml', 'liter': 'l',
	'packung': 'Pack', 'pkg': 'Pack', 'pck': 'Pack',
	'fl': 'Flasche', 'gl': 'Glas'
};

/** Normalisiert Freitext auf eine Katalog-Einheit. Unbekanntes bleibt unverändert. */
export function normalizeUnit(raw: string | null): string | null {
	const t = (raw ?? '').trim();
	if (!t) return null;
	const treffer = UNITS.find((u) => u.toLowerCase() === t.toLowerCase());
	if (treffer) return treffer;
	return UNIT_ALIASES[t.toLowerCase()] ?? t;
}

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

/**
 * Kategorie raten — erst aus der Kaufstatistik (dort steht, was der Nutzer
 * zuletzt tatsächlich gewählt hat), dann per Stichwort.
 */
export function guessCategoryWithHistory(
	name: string,
	stats: KaufStatistik[] | undefined
): string {
	const key = name.trim().toLowerCase();
	const bekannt = (stats ?? []).find((s) => s.name === key);
	if (bekannt?.category) return bekannt.category;
	return guessCategory(name);
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
  isStaple?: boolean;
}

const MAX_STATS = 60;

/** Nimmt einen gekauften Artikel in die Statistik auf. Reine Funktion. */
export function recordPurchase(
	stats: KaufStatistik[] | undefined,
	item: Pick<ShoppingItem, 'name' | 'category' | 'checked_at'>
): KaufStatistik[] {
	const key = item.name.trim().toLowerCase();
	if (!key) return stats ?? [];
	const rest = (stats ?? []).filter((s) => s.name !== key);
	const alt = (stats ?? []).find((s) => s.name === key);
	const neu: KaufStatistik = {
		name: key,
		label: item.name.trim(),
		category: item.category ?? alt?.category ?? null,
		count: (alt?.count ?? 0) + 1,
		last: item.checked_at ?? new Date().toISOString()
	};
	return [neu, ...rest]
		.sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
		.slice(0, MAX_STATS);
}

/**
 * Vorschläge: erst Stammartikel, dann häufig Gekauftes.
 * Was schon offen auf der Liste steht, fällt raus.
 * Speist sich aus der Statistik — NICHT aus abgehakten Zeilen (S-01).
 */
export function suggestions(
	stats: KaufStatistik[] | undefined,
	staples: { name: string; category: string | null }[] | undefined,
	offeneItems: ShoppingItem[],
	limit = 10
): Suggestion[] {
	const active = new Set(offeneItems.map((i) => i.name.toLowerCase()));
	const result: Suggestion[] = [];
	const seen = new Set<string>();

	// 1. Stammartikel
	for (const staple of staples ?? []) {
		const key = staple.name.toLowerCase();
		if (active.has(key) || seen.has(key)) continue;
		result.push({ name: staple.name, category: staple.category, isStaple: true });
		seen.add(key);
	}

	// 2. Aus Statistik
	for (const stat of stats ?? []) {
		if (result.length >= limit) break;
		const key = stat.name;
		if (active.has(key) || seen.has(key)) continue;
		result.push({ name: stat.label, category: stat.category });
		seen.add(key);
	}

	return result;
}

/** „Zuletzt gekauft": Fallback, falls Statistik noch leer (wird kaum mehr verwendet,
 * außer für alte Bestandsdaten ohne KaufStatistik). */
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
