<script lang="ts">
	import ShoppingItemRow from './ShoppingItemRow.svelte';
	import type { ShoppingItem } from '../types';

	let { items }: { items: ShoppingItem[] } = $props();
</script>

<ul class="flex flex-col gap-2">
	{#each items as item (item.id)}
		<ShoppingItemRow {item} />
	{:else}
		<p class="text-sm text-slate-500">Einkaufsliste ist leer.</p>
	{/each}
</ul>
