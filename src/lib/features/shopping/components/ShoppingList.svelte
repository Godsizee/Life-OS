<script lang="ts">
	import { ShoppingCart } from 'lucide-svelte';
	import ShoppingItemRow from './ShoppingItemRow.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import type { ShoppingItem } from '../types';

	let { items }: { items: ShoppingItem[] } = $props();
</script>

{#if items.length === 0}
	<EmptyState icon={ShoppingCart} title="Einkaufsliste ist leer" hint="Füge oben deinen ersten Artikel hinzu." />
{:else}
	<ul class="flex flex-col gap-2">
		{#each items as item (item.id)}
			<ShoppingItemRow {item} />
		{/each}
	</ul>
{/if}
