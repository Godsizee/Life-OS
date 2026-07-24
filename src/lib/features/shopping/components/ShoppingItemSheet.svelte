<script lang="ts">
  import type { ShoppingItem } from '../types';
  import { shoppingState } from '../store.svelte';
  import Sheet from '$lib/ui/Sheet.svelte';
  import Input from '$lib/ui/Input.svelte';
  import Select from '$lib/ui/Select.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Field from '$lib/ui/Field.svelte';
  import { CATEGORY_IDS, CATEGORY_LABELS } from '../categories';

  let { item, open = $bindable(false) }: { item: ShoppingItem | null; open?: boolean } = $props();

  let name = $state('');
  let qty = $state('1');
  let unit = $state('');
  let category = $state('other');
  let note = $state('');

  $effect(() => {
    if (item && open) {
      name = item.name;
      qty = String(item.qty);
      unit = item.unit ?? '';
      category = item.category ?? 'other';
      note = item.note ?? '';
    }
  });

  function persist(patch: Partial<Pick<ShoppingItem, 'name' | 'qty' | 'unit' | 'category' | 'note'>>) {
    if (item) shoppingState.updateItem(item.id, patch);
  }
  function onNameBlur() {
    if (name.trim() && name !== item?.name) persist({ name: name.trim() });
  }
  function onQtyBlur() {
    const q = Number(qty) || 1;
    if (q !== item?.qty) persist({ qty: q });
  }
  function onUnitBlur() {
    const u = unit.trim() || null;
    if (u !== item?.unit) persist({ unit: u });
  }
  function onCategoryChange() {
    persist({ category });
  }
  function onNoteBlur() {
    const n = note.trim() || null;
    if (n !== item?.note) persist({ note: n });
  }
  async function del() {
    if (item) {
      await shoppingState.removeItem(item.id);
      open = false;
    }
  }
</script>

<Sheet bind:open title="Artikel bearbeiten">
  {#if item}
    <div class="flex flex-col gap-4">
      <Field label="Name">
        <Input bind:value={name} onblur={onNameBlur} />
      </Field>
      <div class="grid grid-cols-2 gap-2">
        <Field label="Menge">
          <Input type="number" min="0" step="0.5" bind:value={qty} onblur={onQtyBlur} />
        </Field>
        <Field label="Einheit">
          <Input bind:value={unit} onblur={onUnitBlur} placeholder="z. B. kg, Pack" />
        </Field>
      </div>
      <Field label="Kategorie">
        <Select bind:value={category} onchange={onCategoryChange}>
          {#each CATEGORY_IDS as id (id)}
            <option value={id}>{CATEGORY_LABELS[id]}</option>
          {/each}
        </Select>
      </Field>
      <Field label="Notiz">
        <Input bind:value={note} onblur={onNoteBlur} placeholder="z. B. laktosefrei, 2 Stück" />
      </Field>
      <div class="mt-4 flex justify-end border-t border-border-color pt-4">
        <Button variant="ghost" onclick={del}>
          {#snippet children()}<span class="text-red-500">Löschen</span>{/snippet}
        </Button>
      </div>
    </div>
  {/if}
</Sheet>
