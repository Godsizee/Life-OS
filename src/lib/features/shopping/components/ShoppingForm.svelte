<script lang="ts">
  import Button from '$lib/ui/Button.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Select from '$lib/ui/Select.svelte';
  import { shoppingState } from '../store.svelte';
  import { guessCategory, CATEGORY_IDS, CATEGORY_LABELS } from '../categories';

  let { onsubmitted }: { onsubmitted?: () => void } = $props();

  let name = $state('');
  let qty = $state('1');
  let unit = $state('');
  let category = $state(''); // '' = automatisch
  let note = $state('');

  const autoCategory = $derived(name.trim() ? guessCategory(name) : 'other');

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    await shoppingState.addItem({
      name,
      qty: Number(qty) || 1,
      unit: unit || null,
      category: category || guessCategory(name),
      note: note.trim() || null
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
      <Input type="text" placeholder="Einheit (optional)" bind:value={unit} />
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
