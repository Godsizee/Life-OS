<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { ShoppingItem } from '../types';
	import { shoppingState } from '../store.svelte';

	let { item }: { item: ShoppingItem } = $props();
</script>

<li class="flex items-center gap-3 rounded-xl border border-border-color bg-surface-0 p-3">
	<button
		onclick={() => shoppingState.toggleChecked(item.id)}
		aria-label="Abhaken"
		class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 active:scale-95 transition-transform {item.checked
			? 'border-primary-600 bg-primary-600'
			: 'border-border-color bg-surface-1'}"
	>
		{#if item.checked}<span class="text-xs text-white">✓</span>{/if}
	</button>
	<div class="min-w-0 flex-1">
		<p class="truncate {item.checked ? 'text-text-tertiary line-through' : 'text-text-primary'}">
			{item.name}
		</p>
		{#if item.qty !== 1 || item.unit}
			<p class="text-xs text-text-secondary">{item.qty}{item.unit ? ` ${item.unit}` : ''}</p>
		{/if}
	</div>
	<button
		onclick={() => shoppingState.removeItem(item.id)}
		aria-label="Löschen"
		class="shrink-0 text-text-tertiary active:text-red-600 dark:active:text-red-400"
	>
		<Trash2 size={18} />
	</button>
</li>
