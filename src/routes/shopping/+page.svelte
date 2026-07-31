<script lang="ts">
  import { shoppingState } from '$lib/features/shopping/store.svelte';
  import { authState } from '$lib/core/auth.svelte';
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
  import { suggestions, recentlyBought } from '$lib/features/shopping/categories';

  let createOpen = $state(false);
  let layoutOpen = $state(false);
  let editItem = $state<ShoppingItem | null>(null);
  let editOpen = $state(false);

  // Laden/Entladen liegt zentral in core/workspace-data.ts (+layout.svelte).

  let activeListId = $state<string | null>(null);
  let activeAssigneeFilter = $state<'all' | 'me' | 'unassigned'>('all');

  const shoppingLists = $derived(shoppingState.settings.shopping_lists ?? [{ id: 'default', name: 'Einkauf', icon: '🛒' }]);
  
  $effect(() => {
    if (!activeListId && shoppingLists.length > 0) {
      activeListId = shoppingLists[0].id;
    }
  });

  const activeItems = $derived(shoppingState.items.filter((i) => {
    if (i.checked) return false;
    
    // List filter
    const isFirstList = shoppingLists[0]?.id === activeListId;
    if (i.list_id) {
       if (i.list_id !== activeListId) return false;
    } else {
       if (!isFirstList) return false;
    }

    // Assignee filter
    if (activeAssigneeFilter === 'me') {
       if (i.assignee_id !== authState.user?.id) return false;
    } else if (activeAssigneeFilter === 'unassigned') {
       if (i.assignee_id !== null) return false;
    }

    return true;
  }));
  const suggestedItems = $derived(
    shoppingState.settings.shopping_stats || shoppingState.settings.shopping_staples
      ? suggestions(shoppingState.settings.shopping_stats, shoppingState.settings.shopping_staples, activeItems)
      : recentlyBought(shoppingState.items) // Fallback für Bestandsdaten
  );
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
      <ShoppingForm onsubmitted={() => (createOpen = false)} listId={activeListId === 'default' || activeListId === null ? undefined : activeListId} />
    </div>
  {/snippet}
</Sheet>

<ShoppingItemSheet bind:open={editOpen} item={editItem} />
<ShoppingLayoutSheet bind:open={layoutOpen} />

<section class="flex flex-col gap-4">
  {#if shoppingLists.length > 1}
    <div class="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
      {#each shoppingLists as list}
        <Chip 
          selected={activeListId === list.id} 
          onclick={() => activeListId = list.id}
        >
          {list.icon} {list.name}
        </Chip>
      {/each}
    </div>
  {/if}

  <div class="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
    <Chip selected={activeAssigneeFilter === 'all'} onclick={() => activeAssigneeFilter = 'all'}>Alle</Chip>
    <Chip selected={activeAssigneeFilter === 'me'} onclick={() => activeAssigneeFilter = 'me'}>Meins</Chip>
    <Chip selected={activeAssigneeFilter === 'unassigned'} onclick={() => activeAssigneeFilter = 'unassigned'}>Nicht zugewiesen</Chip>
  </div>
  {#if suggestedItems.length > 0}
    <div>
      <p class="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">Vorschläge</p>
      <div class="flex flex-wrap gap-2">
        {#each suggestedItems as s (s.name)}
          <Chip onclick={() => shoppingState.addItem({ name: s.name, category: s.category })} selected={s.isStaple}>
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
    <div class="flex flex-col items-center gap-1 mt-4 mb-8">
      <Button variant="secondary" onclick={() => shoppingState.clearChecked()}>
        {#snippet children()}
          <span class="inline-flex items-center gap-2"><RotateCcw size={16} /> Abgehakte aufräumen</span>
        {/snippet}
      </Button>
      <p class="text-xs text-text-tertiary text-center">
        Persönliche Vorschläge (Statistik) bleiben erhalten.
      </p>
    </div>
  {/if}
</section>
