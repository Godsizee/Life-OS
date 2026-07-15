<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Icon } from 'lucide-svelte';

	let {
		icon: IconComponent,
		title,
		hint,
		action
	}: {
		icon?: typeof Icon;
		title: string;
		hint?: string;
		action?: Snippet;
	} = $props();
</script>

<div class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-color px-6 py-10 text-center">
	{#if IconComponent}
		<IconComponent size={28} class="text-text-tertiary" />
	{/if}
	<p class="text-sm font-medium text-text-primary">{title}</p>
	{#if hint}
		<p class="text-xs text-text-tertiary">{hint}</p>
	{/if}
	{#if action}
		<div class="mt-2">{@render action()}</div>
	{/if}
</div>
