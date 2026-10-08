<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CircleHelp } from '@lucide/svelte';
	import IconButton from './IconButton.svelte';

	let {
		title,
		subtitle,
		trailing,
		band,
		onhilfe
	}: {
		title: string;
		subtitle?: string;
		trailing?: Snippet;
		/** Fester Platz unter dem Kopf für Modus- und Statusbänder (siehe `Band`). */
		band?: Snippet;
		/** Fester Platz rechts: öffnet die Hilfe des Moduls. Ohne Handler bleibt die Taste weg. */
		onhilfe?: () => void;
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
	class="sticky top-0 z-20 -mx-4 mb-2 flex items-center justify-between gap-3 border-b-[length:var(--rahmen)] border-tinte bg-seite px-4 py-2 transition-opacity duration-[var(--dauer-schnell)] md:-mx-8 md:px-8
		{stuck ? 'opacity-100' : 'pointer-events-none opacity-0'}"
>
	<span class="truncate text-sm font-extrabold text-tinte [font-stretch:85%]">{title}</span>
	{#if trailing && stuck}
		<div class="shrink-0">{@render trailing()}</div>
	{/if}
</div>

<header class="mb-6 flex flex-col gap-3">
	<div class="flex items-center justify-between gap-3">
		<div class="min-w-0">
			<h1 class="truncate text-3xl leading-tight font-extrabold text-tinte [font-stretch:85%]">
				{title}
			</h1>
			{#if subtitle}
				<p class="mono-label mt-1 text-text-2">{subtitle}</p>
			{/if}
		</div>
		<div class="flex shrink-0 items-center gap-2">
			{#if trailing}{@render trailing()}{/if}
			{#if onhilfe}
				<IconButton label="Hilfe zu dieser Seite" variant="surface" onclick={onhilfe}>
					<CircleHelp size={20} />
				</IconButton>
			{/if}
		</div>
	</div>
	{#if band}
		<div>{@render band()}</div>
	{/if}
</header>
