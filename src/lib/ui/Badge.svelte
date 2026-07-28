<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'neutral',
		children
	}: {
		variant?: 'neutral' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';
		children: Snippet;
	} = $props();

	const variants = {
		neutral: 'bg-surface-2 text-text-secondary',
		primary: 'bg-primary-active-bg text-primary-active',
		accent: 'bg-accent-50 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300',
		success: 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300',
		warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
		danger: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
	};
</script>

<span
	class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium nums-tabular {variants[
		variant
	]}"
>
	{@render children()}
</span>
