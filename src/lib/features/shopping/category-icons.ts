import type { Icon } from 'lucide-svelte';
import {
  Carrot, Croissant, Milk, Fish, Snowflake, Package,
  Cookie, CupSoda, SprayCan, Bath, ShoppingBasket
} from 'lucide-svelte';

/** Kategorie-ID → lucide-Icon. Fällt in Komponenten via ?? auf ShoppingBasket zurück. */
export const CATEGORY_ICONS: Record<string, typeof Icon> = {
  produce: Carrot,
  bakery: Croissant,
  dairy: Milk,
  meat: Fish,
  frozen: Snowflake,
  pantry: Package,
  snacks: Cookie,
  drinks: CupSoda,
  household: SprayCan,
  care: Bath,
  other: ShoppingBasket
};
