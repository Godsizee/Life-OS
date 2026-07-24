<script lang="ts">
  import { ShoppingCart } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import ShoppingItemRow from './ShoppingItemRow.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import { DURATION, motionDuration } from '$lib/ui/motion';
  import type { ShoppingItem } from '../types';
  import { groupByCategory, CATEGORY_LABELS } from '../categories';
  import { CATEGORY_ICONS } from '../category-icons';

  let { items, order, onopen }: {
    items: ShoppingItem[];
    order: string[];
    onopen?: (item: ShoppingItem) => void;
  } = $props();

  const groups = $derived(groupByCategory(items, order));
</script>

{#if items.length === 0}
  <EmptyState icon={ShoppingCart} title="Einkaufsliste ist leer" hint="Füge oben deinen ersten Artikel hinzu." />
{:else}
  <div class="flex flex-col gap-5">
    {#each groups as group (group.categoryId)}
      {@const Icon = CATEGORY_ICONS[group.categoryId] ?? CATEGORY_ICONS.other}
      <section transition:fade={{ duration: motionDuration(DURATION.fast) }}>
        <h3 class="mb-2 flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
          <Icon size={14} />
          {CATEGORY_LABELS[group.categoryId] ?? 'Sonstiges'}
          <span class="opacity-60">{group.items.length}</span>
        </h3>
        <ul class="flex flex-col gap-2">
          {#each group.items as item (item.id)}
            <li class="contents" animate:flip={{ duration: motionDuration(DURATION.base) }}>
              <ShoppingItemRow {item} {onopen} />
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
{/if}
