<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		leading,
		trailing,
		children,
		align = 'center',
		class: className = ''
	}: {
		leading?: Snippet;
		trailing?: Snippet;
		children?: Snippet;
		align?: 'center' | 'start';
		class?: string;
	} = $props();
</script>

<div
	class="flex min-h-12 gap-3 rounded-xl border border-border-color bg-surface-0 p-3 {align === 'start'
		? 'items-start'
		: 'items-center'} {className}"
>
	{#if leading}
		<div class="shrink-0">{@render leading()}</div>
	{/if}
	<div class="min-w-0 flex-1">
		{@render children?.()}
	</div>
	{#if trailing}
		<div class="shrink-0">{@render trailing()}</div>
	{/if}
</div>
