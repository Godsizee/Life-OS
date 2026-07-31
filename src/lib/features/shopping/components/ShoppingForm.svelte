<script lang="ts">
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Select from '$lib/ui/Select.svelte';
  import { shoppingState } from '../store.svelte';
  import { guessCategoryWithHistory, CATEGORY_IDS, CATEGORY_LABELS, UNITS } from '../categories';

  let { onsubmitted, listId }: { onsubmitted?: () => void, listId?: string } = $props();

  let name = $state('');
  let qty = $state('1');
  let unit = $state('');
  let category = $state(''); // '' = automatisch
  let note = $state('');



  const autoCategory = $derived(name.trim() ? guessCategoryWithHistory(name, shoppingState.settings.shopping_stats) : 'other');

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await shoppingState.addItem({
      name,
      qty: Number(qty) || 1,
      unit: unit || null,
      category: category || autoCategory,
      note: note.trim() || null,
      list_id: listId || null
    });
    name = '';
    qty = '1';
    unit = '';
    category = '';
    note = '';
    onsubmitted?.();
  }
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
  <div class="flex gap-2">
    <Input placeholder="Artikel…" bind:value={name} required />
    <Button type="submit">
      {#snippet children()}+{/snippet}
    </Button>
  </div>
  <div class="flex gap-2">
    <div class="w-24">
      <Input type="number" min="0" step="0.5" placeholder="Menge" bind:value={qty} />
    </div>
    <div class="flex-1">
      <Select bind:value={unit}>
        <option value="">— keine —</option>
        {#each UNITS as u}
          <option value={u}>{u}</option>
        {/each}
      </Select>
    </div>
  </div>
  <Select bind:value={category}>
    <option value="">Automatisch{name.trim() ? `: ${CATEGORY_LABELS[autoCategory]}` : ''}</option>
    {#each CATEGORY_IDS as id (id)}
      <option value={id}>{CATEGORY_LABELS[id]}</option>
    {/each}
  </Select>
  <Input type="text" placeholder="Notiz (optional)" bind:value={note} />
</form>
