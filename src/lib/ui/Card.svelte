<script lang="ts">
	import type { Snippet } from 'svelte';
	import Box from './Box.svelte';

	/** Dünner Alias auf `Box`, bis P7 alle Aufrufstellen umgestellt hat. Nur drückbare Boxen haben einen Schatten. */
	let {
		interactive = false,
		container = false,
		class: className = '',
		onclick,
		children
	}: {
		interactive?: boolean;
		/** Macht die Karte zum Container-Query-Kontext (@sm/@md auf Kindern). */
		container?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	} = $props();
</script>

<Box interaktiv={interactive} {container} class={className} {onclick}>
	{@render children()}
</Box>
