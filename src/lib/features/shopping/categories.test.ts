import { describe, expect, it } from 'vitest';
import { guessCategory, orderedCategoryIds, groupByCategory, recentlyBought } from './categories';
import type { ShoppingItem } from './types';

const base = {
  workspace_id: 'ws', unit: null as string | null, note: null as string | null,
  checked: false, checked_at: null as string | null, position: 0, added_by: 'u',
  created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z'
};
const item = (over: Partial<ShoppingItem> & { id: string; name: string }): ShoppingItem =>
  ({ ...base, qty: 1, category: null, ...over });

describe('guessCategory', () => {
  it('ordnet bekannte Artikel zu', () => {
    expect(guessCategory('Milch')).toBe('dairy');
    expect(guessCategory('2 Äpfel')).toBe('produce');
    expect(guessCategory('Klopapier')).toBe('household');
  });
  it('fällt auf other zurück', () => {
    expect(guessCategory('Xyzzy')).toBe('other');
    expect(guessCategory('')).toBe('other');
  });
});

describe('orderedCategoryIds', () => {
  it('nutzt gespeicherte Reihenfolge und hängt fehlende an, ohne Duplikate', () => {
    const r = orderedCategoryIds(['household', 'dairy']);
    expect(r.slice(0, 2)).toEqual(['household', 'dairy']);
    expect(r).toContain('produce');
    expect(new Set(r).size).toBe(r.length);
  });
  it('ignoriert unbekannte IDs', () => {
    expect(orderedCategoryIds(['nope'])).not.toContain('nope');
  });
});

describe('groupByCategory', () => {
  it('gruppiert nach Reihenfolge, leere Kategorien entfallen', () => {
    const items = [
      item({ id: '1', name: 'Milch', category: 'dairy' }),
      item({ id: '2', name: 'Apfel', category: 'produce' }),
      item({ id: '3', name: 'Käse', category: 'dairy' })
    ];
    const groups = groupByCategory(items, ['produce', 'dairy']);
    expect(groups.map((g) => g.categoryId)).toEqual(['produce', 'dairy']);
    expect(groups[1].items.map((i) => i.id)).toEqual(['1', '3']);
  });
  it('unbekannte/leere Kategorie landet in other', () => {
    const groups = groupByCategory([item({ id: '1', name: 'Ding', category: null })], undefined);
    expect(groups.at(-1)?.categoryId).toBe('other');
  });
});

describe('recentlyBought', () => {
  it('liefert eindeutige, nach Zeit sortierte Namen ohne aktive', () => {
    const items = [
      item({ id: '1', name: 'Milch', checked: true, checked_at: '2026-01-02T00:00:00.000Z' }),
      item({ id: '2', name: 'Brot', checked: true, checked_at: '2026-01-03T00:00:00.000Z' }),
      item({ id: '3', name: 'Milch', checked: true, checked_at: '2026-01-01T00:00:00.000Z' }),
      item({ id: '4', name: 'Eier', checked: false }),
      item({ id: '5', name: 'Eier', checked: true, checked_at: '2026-01-04T00:00:00.000Z' })
    ];
    // Eier ist aktiv (id 4) → raus; Milch dedupliziert; Sortierung nach checked_at desc.
    expect(recentlyBought(items).map((s) => s.name)).toEqual(['Brot', 'Milch']);
  });
});
