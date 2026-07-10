<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		type = 'button',
		disabled = false,
		onclick,
		children
	}: {
		variant?: 'primary' | 'secondary' | 'ghost';
		type?: 'button' | 'submit';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	} = $props();

	const variants = {
		primary: 'bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 text-white',
		secondary: 'bg-surface-2 text-text-primary active:bg-surface-3 border border-border-color',
		ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-2 active:bg-surface-3'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="min-h-12 rounded-xl px-4 font-medium transition-transform active:scale-95 disabled:opacity-50 {variants[
		variant
	]}"
>
	{@render children()}
</button>
