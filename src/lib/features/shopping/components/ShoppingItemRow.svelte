<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { ShoppingItem } from '../types';
	import { shoppingState } from '../store.svelte';

	let { item }: { item: ShoppingItem } = $props();
</script>

<li class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
	<button
		onclick={() => shoppingState.toggleChecked(item.id)}
		aria-label="Abhaken"
		class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 active:scale-95 transition-transform {item.checked
			? 'border-emerald-600 bg-emerald-600'
			: 'border-slate-300'}"
	>
		{#if item.checked}<span class="text-xs text-white">✓</span>{/if}
	</button>
	<div class="min-w-0 flex-1">
		<p class="truncate {item.checked ? 'text-slate-400 line-through' : 'text-slate-900'}">
			{item.name}
		</p>
		{#if item.qty !== 1 || item.unit}
			<p class="text-xs text-slate-500">{item.qty}{item.unit ? ` ${item.unit}` : ''}</p>
		{/if}
	</div>
	<button
		onclick={() => shoppingState.removeItem(item.id)}
		aria-label="Löschen"
		class="shrink-0 text-slate-400 active:text-red-600"
	>
		<Trash2 size={18} />
	</button>
</li>
