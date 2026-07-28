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

	// Sobald der grosse Titel hochgescrollt ist, blendet eine schmale Leiste mit
	// Kurztitel ein – der Seitenkontext bleibt sichtbar, ohne dauerhaft Hoehe zu
	// kosten. Rein visuell: der <h1> bleibt der einzige Titel im A11y-Baum.
	let sentinel = $state<HTMLElement | null>(null);
	let stuck = $state(false);

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(([entry]) => (stuck = !entry.isIntersecting), {
			threshold: 0
		});
		observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

<div bind:this={sentinel} aria-hidden="true"></div>

<div
	aria-hidden={!stuck}
	class="sticky top-0 z-20 -mx-4 mb-2 flex items-center justify-between gap-3 border-b border-border-color px-4 py-2 glass-chrome transition-opacity duration-200 md:-mx-8 md:px-8
		{stuck ? 'opacity-100' : 'pointer-events-none opacity-0'}"
>
	<span class="truncate text-sm font-bold tracking-tight text-text-primary">{title}</span>
	{#if trailing && stuck}
		<div class="shrink-0">{@render trailing()}</div>
	{/if}
</div>

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
