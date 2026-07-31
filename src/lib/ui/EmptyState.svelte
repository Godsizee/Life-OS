<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Icon } from 'lucide-svelte';

	let {
		icon: IconComponent,
		title,
		hint,
		action,
		size = 'base'
	}: {
		icon?: typeof Icon;
		title: string;
		hint?: string;
		action?: Snippet;
		/** 'sm' für Dashboard-Kacheln, 'base' für ganze Seiten. */
		size?: 'sm' | 'base';
	} = $props();
</script>

<div class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-color px-6 {size === 'sm' ? 'py-6' : 'py-12'} text-center">
	{#if IconComponent}
		<IconComponent size={size === 'sm' ? 32 : 48} class="text-text-tertiary" />
	{/if}
	<p class="{size === 'sm' ? 'text-xs font-semibold' : 'text-sm font-medium'} text-text-primary">{title}</p>
	{#if hint}
		<p class="text-xs text-text-tertiary">{hint}</p>
	{/if}
	{#if action}
		<div class="mt-2">{@render action()}</div>
	{/if}
</div>
