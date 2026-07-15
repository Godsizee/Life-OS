<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		leading,
		trailing,
		children,
		class: className = ''
	}: {
		leading?: Snippet;
		trailing?: Snippet;
		children?: Snippet;
		class?: string;
	} = $props();
</script>

<li class="flex min-h-12 items-center gap-3 rounded-xl border border-border-color bg-surface-0 p-3 {className}">
	{#if leading}
		<div class="shrink-0">{@render leading()}</div>
	{/if}
	<div class="min-w-0 flex-1">
		{@render children?.()}
	</div>
	{#if trailing}
		<div class="shrink-0">{@render trailing()}</div>
	{/if}
</li>
