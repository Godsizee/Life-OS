<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		interactive = false,
		shadow = false,
		class: className = '',
		onclick,
		children
	}: {
		interactive?: boolean;
		shadow?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	} = $props();
</script>

<svelte:element
	this={onclick ? 'button' : 'div'}
	type={onclick ? 'button' : undefined}
	role={onclick ? 'button' : undefined}
	{onclick}
	class="w-full rounded-2xl border border-border-color bg-surface-0 text-left {shadow ? 'premium-shadow' : ''} {interactive
		? 'interactive-card'
		: ''} {className}"
>
	{@render children()}
</svelte:element>
