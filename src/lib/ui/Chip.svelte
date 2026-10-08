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
	class="mono-label inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-sm border-[length:var(--rahmen-s)] border-tinte px-3 py-1
		{selected ? 'bg-tinte text-seite' : 'bg-flaeche text-tinte hover:bg-flaeche-2'}"
>
	{@render children()}
</button>
