<script lang="ts">
  import { shoppingState } from '../store.svelte';
  import Sheet from '$lib/ui/Sheet.svelte';
  import { CATEGORY_LABELS } from '../categories';
  import { CATEGORY_ICONS } from '../category-icons';
  import { ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-svelte';
  import Input from '$lib/ui/Input.svelte';
  import Button from '$lib/ui/Button.svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  function move(index: number, dir: -1 | 1) {
    const ids = [...shoppingState.categoryOrder];
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    shoppingState.setCategoryOrder(ids);
  }

  let newListName = $state('');
  let newListIcon = $state('🛒');

  function addList() {
    if (!newListName.trim()) return;
    const lists = shoppingState.settings.shopping_lists ?? [{ id: 'default', name: 'Einkauf', icon: '🛒' }];
    shoppingState.setLists([...lists, { id: crypto.randomUUID(), name: newListName.trim(), icon: newListIcon.trim() || '🛒' }]);
    newListName = '';
  }

  function removeList(id: string) {
    const lists = shoppingState.settings.shopping_lists ?? [{ id: 'default', name: 'Einkauf', icon: '🛒' }];
    shoppingState.setLists(lists.filter(l => l.id !== id));
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

  <h3 class="mt-8 mb-2 px-1 text-sm font-semibold text-text-primary">Einkaufslisten</h3>
  <p class="mb-3 px-1 text-xs text-text-tertiary">Eigene Listen anlegen (z.B. Baumarkt, Drogerie).</p>
  <ul class="flex flex-col gap-2 mb-4">
    {#each (shoppingState.settings.shopping_lists ?? [{ id: 'default', name: 'Einkauf', icon: '🛒' }]) as list}
      <li class="flex items-center gap-3 rounded-xl border border-border-color bg-surface-0 px-3 py-2">
        <span class="shrink-0">{list.icon}</span>
        <span class="flex-1 text-sm text-text-primary">{list.name}</span>
        {#if list.id !== 'default'}
          <button onclick={() => removeList(list.id)} class="p-1.5 text-text-tertiary hover:text-red-500 active:scale-95">
            <Trash2 size={16} />
          </button>
        {/if}
      </li>
    {/each}
  </ul>
  <div class="flex gap-2">
    <div class="w-16">
      <Input placeholder="🛒" bind:value={newListIcon} />
    </div>
    <div class="flex-1">
      <Input placeholder="Neue Liste" bind:value={newListName} onkeydown={(e) => e.key === 'Enter' && addList()} />
    </div>
    <Button onclick={addList} disabled={!newListName.trim()}>
      {#snippet children()}<Plus size={20} />{/snippet}
    </Button>
  </div>

  {#if shoppingState.settings.shopping_staples && shoppingState.settings.shopping_staples.length > 0}
    <h3 class="mt-8 mb-2 px-1 text-sm font-semibold text-text-primary">Stammartikel</h3>
    <ul class="flex flex-col gap-2 mb-4">
      {#each shoppingState.settings.shopping_staples as staple}
        <li class="flex items-center gap-3 rounded-xl border border-border-color bg-surface-0 px-3 py-2">
          <span class="flex-1 text-sm text-text-primary">{staple.name}</span>
          <button onclick={() => shoppingState.toggleStaple(staple.name, staple.category, false)} class="p-1.5 text-text-tertiary hover:text-red-500 active:scale-95">
            <Trash2 size={16} />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</Sheet>
