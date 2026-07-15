<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { ShoppingItem } from '../types';
	import { shoppingState } from '../store.svelte';
	import ListRow from '$lib/ui/ListRow.svelte';
	import CheckCircle from '$lib/ui/CheckCircle.svelte';
	import SwipeToDelete from '$lib/ui/SwipeToDelete.svelte';

	let { item }: { item: ShoppingItem } = $props();
</script>

<SwipeToDelete onDelete={() => shoppingState.removeItem(item.id)} label="Artikel löschen">
	<ListRow>
		{#snippet leading()}
			<CheckCircle checked={item.checked} ontoggle={() => shoppingState.toggleChecked(item.id)} />
		{/snippet}
		<p class="truncate {item.checked ? 'text-text-tertiary line-through' : 'text-text-primary'}">
			{item.name}
		</p>
		{#if item.qty !== 1 || item.unit}
			<p class="text-xs text-text-secondary">{item.qty}{item.unit ? ` ${item.unit}` : ''}</p>
		{/if}
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
