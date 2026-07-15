<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		selected = false,
		onclick,
		children
	}: {
		selected?: boolean;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	} = $props();
</script>

<button
	type="button"
	{onclick}
	aria-pressed={selected}
	class="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-all active:scale-95
		{selected
			? 'border-primary-700 bg-primary-700 text-white dark:border-primary-600 dark:bg-primary-600'
			: 'border-border-color bg-surface-0 text-text-secondary hover:bg-surface-1'}"
>
	{@render children()}
</button>
