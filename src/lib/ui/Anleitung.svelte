<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconKomponente } from '#lib/ui/icon.js';
	import Button from './Button.svelte';

	let {
		icon: IconComponent,
		titel,
		was,
		ersterSchritt,
		beispiel,
		size = 'base'
	}: {
		icon?: IconKomponente;
		titel: string;
		/** Ein Satz: was ist das, wofür ist es da? */
		was?: string;
		/** Der erste Schritt als Aktion, z. B. eine Taste „Aufgabe anlegen“. */
		ersterSchritt?: Snippet;
		/** Optional „Beispiel anlegen“: füllt die Ansicht mit einem Muster. */
		beispiel?: { label?: string; onclick: () => void };
		/** 'sm' für Kacheln, 'base' für ganze Seiten. */
		size?: 'sm' | 'base';
	} = $props();

	const Titel = $derived(size === 'sm' ? 'h3' : 'h2');
</script>

<!-- Ein leerer Zustand ist eine Anleitung: was das ist, der erste Schritt, ein Beispiel. -->
<div
	class="flex flex-col items-center gap-2 rounded-lg border-[length:var(--rahmen-s)] border-dashed border-tinte px-6 text-center {size ===
	'sm'
		? 'py-6'
		: 'py-12'}"
>
	{#if IconComponent}
		<IconComponent size={size === 'sm' ? 32 : 48} class="text-text-3" />
	{/if}
	<svelte:element
		this={Titel}
		class="{size === 'sm' ? 'text-sm' : 'text-lg'} font-extrabold text-tinte [font-stretch:85%]"
	>
		{titel}
	</svelte:element>
	{#if was}
		<p class="max-w-prose text-sm text-text-2">{was}</p>
	{/if}
	{#if ersterSchritt || beispiel}
		<div class="mt-2 flex flex-wrap items-center justify-center gap-3">
			{#if ersterSchritt}{@render ersterSchritt()}{/if}
			{#if beispiel}
				<Button variant="ghost" size="sm" onclick={beispiel.onclick}>
					{beispiel.label ?? 'Beispiel anlegen'}
				</Button>
			{/if}
		</div>
	{/if}
</div>
