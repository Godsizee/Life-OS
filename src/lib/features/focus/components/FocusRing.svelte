<script lang="ts">
	// W6 — Timer-Ring. Dumme Komponente: bekommt Fortschritt (0..1) und Text.
	import Ring from '#lib/ui/charts/Ring.svelte';

	let {
		progress,
		clock,
		caption = '',
		accent = 'focus',
		size = 176
	}: {
		progress: number;
		clock: string;
		caption?: string;
		accent?: 'focus' | 'break';
		size?: number;
	} = $props();

	// progress 0 -> voller Ring, 1 -> leer (läuft ab wie eine Sanduhr).
	const rest = $derived((1 - Math.min(1, Math.max(0, progress))) * 100);
</script>

<Ring
	wert={rest}
	groesse={size}
	strich={8}
	farbe={accent === 'break' ? 'health' : 'focus'}
	beschreibung="{accent === 'break' ? 'Pause' : 'Fokusrunde'}: noch {clock}"
>
	{#snippet mitte()}
		<span class="text-4xl font-extrabold tabular-nums">{clock}</span>
		{#if caption}
			<span class="mono-label mt-0.5 text-text-3">{caption}</span>
		{/if}
	{/snippet}
</Ring>
