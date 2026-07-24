<script lang="ts">
  import { Trash2, AlignLeft } from 'lucide-svelte';
  import type { ShoppingItem } from '../types';
  import { shoppingState } from '../store.svelte';
  import ListRow from '$lib/ui/ListRow.svelte';
  import CheckCircle from '$lib/ui/CheckCircle.svelte';
  import SwipeToDelete from '$lib/ui/SwipeToDelete.svelte';

  let { item, onopen }: { item: ShoppingItem; onopen?: (item: ShoppingItem) => void } = $props();
</script>

<SwipeToDelete onDelete={() => shoppingState.removeItem(item.id)} label="Artikel löschen">
  <ListRow>
    {#snippet leading()}
      <CheckCircle checked={item.checked} ontoggle={() => shoppingState.toggleChecked(item.id)} />
    {/snippet}

    <div
      class="flex flex-1 flex-col min-w-0 {onopen ? 'cursor-pointer' : ''}"
      role="button"
      tabindex="0"
      onclick={() => onopen?.(item)}
      onkeydown={(e) => e.key === 'Enter' && onopen?.(item)}
    >
      <div class="flex items-center gap-2">
        <p class="truncate {item.checked ? 'text-text-tertiary line-through' : 'text-text-primary'}">
          {item.name}
        </p>
        {#if item.qty !== 1 || item.unit}
          <span class="shrink-0 text-xs text-text-secondary">{item.qty}{item.unit ? ` ${item.unit}` : ''}</span>
        {/if}
      </div>
      {#if item.note}
        <span class="flex items-center gap-1 truncate text-xs text-text-tertiary">
          <AlignLeft size={11} class="shrink-0" />
          {item.note}
        </span>
      {/if}
    </div>

    {#snippet trailing()}
      <button
        onclick={() => shoppingState.removeItem(item.id)}
        aria-label="Löschen"
        class="shrink-0 text-text-tertiary active:text-red-600 dark:active:text-red-400"
      >
        <Trash2 size={18} />
      </button>
    {/snippet}
  </ListRow>
</SwipeToDelete>
