<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ModulId } from '#lib/config/modules.js';

	let {
		farbe = 'signal',
		onclick,
		label,
		expanded,
		class: className = '',
		children
	}: {
		farbe?: 'signal' | ModulId;
		/** Mit Handler wird der Sticker zur Taste (z. B. `WARUM?`). */
		onclick?: (event: MouseEvent) => void;
		/** Zugänglicher Name, wenn der sichtbare Text allein nicht reicht. */
		label?: string;
		/** Für Tasten, die einen Bereich auf- und zuklappen. */
		expanded?: boolean;
		class?: string;
		children: Snippet;
	} = $props();

	const hintergrund = $derived(farbe === 'signal' ? 'var(--signal)' : `var(--mod-${farbe})`);
</script>

{#if onclick}
	<button
		type="button"
		{onclick}
		aria-label={label}
		aria-expanded={expanded}
		style:background-color={hintergrund}
		class="sticker druckbar min-h-6 cursor-pointer {className}"
	>
		{@render children()}
	</button>
{:else}
	<span style:background-color={hintergrund} class="sticker {className}">
		{@render children()}
	</span>
{/if}
