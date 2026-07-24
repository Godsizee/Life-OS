<script lang="ts">
  import { shoppingState } from '../store.svelte';
  import Sheet from '$lib/ui/Sheet.svelte';
  import { CATEGORY_LABELS } from '../categories';
  import { CATEGORY_ICONS } from '../category-icons';
  import { ChevronUp, ChevronDown } from 'lucide-svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  function move(index: number, dir: -1 | 1) {
    const ids = [...shoppingState.categoryOrder];
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    shoppingState.setCategoryOrder(ids);
  }
</script>

<Sheet bind:open title="Ladenlayout">
  <p class="mb-3 px-1 text-xs text-text-tertiary">
    Reihenfolge der Kategorien in deiner Liste. Gilt für alle im Workspace.
  </p>
  <ul class="flex flex-col gap-1">
    {#each shoppingState.categoryOrder as id, i (id)}
      {@const Icon = CATEGORY_ICONS[id] ?? CATEGORY_ICONS.other}
      <li class="flex items-center gap-3 rounded-xl border border-border-color bg-surface-0 px-3 py-2">
        <Icon size={16} class="shrink-0 text-text-secondary" />
        <span class="flex-1 text-sm text-text-primary">{CATEGORY_LABELS[id] ?? id}</span>
        <button
          onclick={() => move(i, -1)}
          disabled={i === 0}
          aria-label="Nach oben"
          class="p-1.5 text-text-tertiary disabled:opacity-30 active:text-text-primary"
        >
          <ChevronUp size={18} />
        </button>
        <button
          onclick={() => move(i, 1)}
          disabled={i === shoppingState.categoryOrder.length - 1}
          aria-label="Nach unten"
          class="p-1.5 text-text-tertiary disabled:opacity-30 active:text-text-primary"
        >
          <ChevronDown size={18} />
        </button>
      </li>
    {/each}
  </ul>
</Sheet>
