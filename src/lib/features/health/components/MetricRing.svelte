<script lang="ts">
	// W9 — Fortschrittsring je Metrik (ui/charts/Ring) mit Beschriftung darunter.
	import type { IconKomponente } from '#lib/ui/icon.js';
	import Ring from '#lib/ui/charts/Ring.svelte';
	import type { ChartFarbe } from '#lib/ui/charts/farbe.js';

	let {
		percent,
		label,
		value,
		goalLabel,
		icon: IconComponent,
		size = 88,
		farbe = 'health'
	}: {
		percent: number;
		label: string;
		value: string;
		goalLabel?: string;
		icon?: IconKomponente;
		size?: number;
		farbe?: ChartFarbe;
	} = $props();
</script>

<div class="flex flex-col items-center gap-1.5">
	<Ring
		wert={percent}
		groesse={size}
		{farbe}
		beschreibung="{label}: {value}{goalLabel ? `, ${goalLabel}` : ''}"
	>
		{#snippet mitte()}
			{#if IconComponent}
				<IconComponent size={14} class="text-text-3" />
			{/if}
			<span class="text-sm font-extrabold tabular-nums">{value}</span>
		{/snippet}
	</Ring>
	<span class="mono-label text-tinte">{label}</span>
	{#if goalLabel}
		<span class="text-xs text-text-2">{goalLabel}</span>
	{/if}
</div>
