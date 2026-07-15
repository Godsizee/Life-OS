<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		hint,
		error,
		children
	}: {
		label?: string;
		hint?: string;
		error?: string;
		children: Snippet;
	} = $props();
</script>

<label class="flex flex-col gap-1.5">
	{#if label}
		<span class="text-sm font-medium text-text-secondary">{label}</span>
	{/if}
	{@render children()}
	{#if error}
		<span class="text-xs text-red-500">{error}</span>
	{:else if hint}
		<span class="text-xs text-text-tertiary">{hint}</span>
	{/if}
</label>
