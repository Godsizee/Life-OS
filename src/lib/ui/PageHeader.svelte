<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		trailing
	}: {
		title: string;
		subtitle?: string;
		trailing?: Snippet;
	} = $props();
</script>

<header class="mb-6 flex items-center justify-between gap-3">
	<div class="min-w-0">
		<h1 class="truncate text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
		{#if subtitle}
			<p class="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
		{/if}
	</div>
	{#if trailing}
		<div class="shrink-0">{@render trailing()}</div>
	{/if}
</header>
