<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		interactive = false,
		shadow = false,
		elevation,
		container = false,
		class: className = '',
		onclick,
		children
	}: {
		interactive?: boolean;
		/** Alt-Prop: entspricht elevation={1}. Bleibt für bestehende Aufrufstellen. */
		shadow?: boolean;
		elevation?: 0 | 1 | 2;
		/** Macht die Karte zum Container-Query-Kontext (@sm/@md auf Kindern). */
		container?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	} = $props();

	const level = $derived(elevation ?? (shadow ? 1 : 0));
	const elevationClass = $derived(level === 2 ? 'elevation-2' : level === 1 ? 'elevation-1' : '');
</script>

<svelte:element
	this={onclick ? 'button' : 'div'}
	type={onclick ? 'button' : undefined}
	role={onclick ? 'button' : undefined}
	{onclick}
	class="w-full rounded-2xl border border-border-color bg-surface-0 text-left {elevationClass} {interactive
		? 'interactive-card'
		: ''} {container ? '@container' : ''} {className}"
>
	{@render children()}
</svelte:element>
