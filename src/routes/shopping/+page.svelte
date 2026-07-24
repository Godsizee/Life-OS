<script lang="ts">
  import { onDestroy } from 'svelte';
  import { workspaceState } from '$lib/features/workspace/store.svelte';
  import { shoppingState } from '$lib/features/shopping/store.svelte';
  import type { ShoppingItem } from '$lib/features/shopping/types';
  import ShoppingForm from '$lib/features/shopping/components/ShoppingForm.svelte';
  import ShoppingGroupedList from '$lib/features/shopping/components/ShoppingGroupedList.svelte';
  import ShoppingItemSheet from '$lib/features/shopping/components/ShoppingItemSheet.svelte';
  import ShoppingLayoutSheet from '$lib/features/shopping/components/ShoppingLayoutSheet.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Chip from '$lib/ui/Chip.svelte';
  import PageHeader from '$lib/ui/PageHeader.svelte';
  import Sheet from '$lib/ui/Sheet.svelte';
  import Skeleton from '$lib/ui/Skeleton.svelte';
  import { Plus, SlidersHorizontal, RotateCcw } from 'lucide-svelte';
  import { recentlyBought } from '$lib/features/shopping/categories';

  let createOpen = $state(false);
  let layoutOpen = $state(false);
  let editItem = $state<ShoppingItem | null>(null);
  let editOpen = $state(false);

  $effect(() => {
    const id = workspaceState.workspace?.id;
    if (id) shoppingState.load(id);
  });
  onDestroy(() => shoppingState.unload());

  const activeItems = $derived(shoppingState.items.filter((i) => !i.checked));
  const suggestions = $derived(recentlyBought(shoppingState.items));
  const hasHistory = $derived(shoppingState.items.some((i) => i.checked));

  function openEdit(item: ShoppingItem) {
    editItem = item;
    editOpen = true;
  }
</script>

<svelte:head>
  <title>Einkauf - Life OS</title>
</svelte:head>

<PageHeader title="Einkauf">
  {#snippet trailing()}
    <button
      onclick={() => (layoutOpen = true)}
      aria-label="Ladenlayout"
      class="flex h-12 w-12 items-center justify-center rounded-xl text-text-secondary hover:text-text-primary"
    >
      <SlidersHorizontal size={20} />
    </button>
    <button
      onclick={() => (createOpen = true)}
      aria-label="Neuer Artikel"
      class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white transition-transform active:scale-95"
    >
      <Plus size={22} />
    </button>
  {/snippet}
</PageHeader>

<Sheet bind:open={createOpen} title="Neuer Artikel">
  {#snippet children()}
    <div class="p-4">
      <ShoppingForm onsubmitted={() => (createOpen = false)} />
    </div>
  {/snippet}
</Sheet>

<ShoppingItemSheet bind:open={editOpen} item={editItem} />
<ShoppingLayoutSheet bind:open={layoutOpen} />

<section class="flex flex-col gap-4">
  {#if suggestions.length > 0}
    <div>
      <p class="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">Zuletzt gekauft</p>
      <div class="flex flex-wrap gap-2">
        {#each suggestions as s (s.name)}
          <Chip onclick={() => shoppingState.addItem({ name: s.name, category: s.category })}>
            + {s.name}
          </Chip>
        {/each}
      </div>
    </div>
  {/if}

  {#if shoppingState.loading}
    <div class="flex flex-col gap-2">
      <Skeleton height="3.5rem" />
      <Skeleton height="3.5rem" />
      <Skeleton height="3.5rem" />
    </div>
  {:else}
    <ShoppingGroupedList items={activeItems} order={shoppingState.categoryOrder} onopen={openEdit} />
  {/if}

  {#if hasHistory}
    <Button variant="secondary" onclick={() => shoppingState.clearChecked()}>
      {#snippet children()}
        <span class="inline-flex items-center gap-2"><RotateCcw size={16} /> Verlauf leeren</span>
      {/snippet}
    </Button>
  {/if}
</section>
