<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ModulId } from '#lib/config/modules.js';

	let {
		modul,
		titel,
		interaktiv = false,
		container = false,
		class: className = '',
		onclick,
		children
	}: {
		/** Kopfband in der Modulfarbe (nur zusammen mit `titel`). */
		modul?: ModulId;
		titel?: string;
		/** Drückbar: harter Versatzschatten, sinkt beim Drücken ein. */
		interaktiv?: boolean;
		/** Macht die Box zum Container-Query-Kontext (@sm/@md auf Kindern). */
		container?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	} = $props();

	const druckbar = $derived(interaktiv || !!onclick);
</script>

<svelte:element
	this={onclick ? 'button' : 'div'}
	type={onclick ? 'button' : undefined}
	role={onclick ? 'button' : undefined}
	{onclick}
	class="box w-full text-left {druckbar ? 'druckbar' : ''} {container
		? '@container'
		: ''} {className}"
>
	{#if titel}
		<div
			class="mono-label rounded-t-[calc(var(--kante-l)-var(--rahmen))] border-b-[length:var(--rahmen)] border-tinte px-3 py-2 text-auf-farbe {modul
				? ''
				: 'bg-flaeche-2 text-tinte'}"
			style:background-color={modul ? `var(--mod-${modul})` : undefined}
		>
			{titel}
		</div>
	{/if}
	{@render children()}
</svelte:element>
