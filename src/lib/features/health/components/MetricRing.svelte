<script lang="ts">
	// W9 — Fortschrittsring je Metrik. Handgerolltes SVG (stroke-dasharray),
	// Muster: analytics/components/ScoreRing.svelte, aber generisch und kleiner.
	import type { Icon } from 'lucide-svelte';

	let {
		percent,
		label,
		value,
		goalLabel,
		icon: IconComponent,
		size = 88,
		colorClass = 'stroke-primary-600 dark:stroke-primary-400'
	}: {
		percent: number;
		label: string;
		value: string;
		goalLabel?: string;
		icon?: typeof Icon;
		size?: number;
		colorClass?: string;
	} = $props();

	const RADIUS = 40;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	const offset = $derived(CIRCUMFERENCE - (Math.max(0, Math.min(100, percent)) / 100) * CIRCUMFERENCE);
</script>

<div class="flex flex-col items-center gap-1.5">
	<div class="relative flex items-center justify-center" style="width: {size}px; height: {size}px;">
		<svg class="-rotate-90" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
			<circle cx="50" cy="50" r={RADIUS} fill="none" stroke="currentColor" stroke-width="9" class="text-surface-3" />
			<circle
				cx="50"
				cy="50"
				r={RADIUS}
				fill="none"
				stroke-width="9"
				stroke-linecap="round"
				stroke-dasharray={CIRCUMFERENCE}
				stroke-dashoffset={offset}
				class="transition-all duration-700 ease-out {colorClass}"
			/>
		</svg>
		<div class="absolute flex flex-col items-center">
			{#if IconComponent}
				<IconComponent size={14} class="text-text-tertiary" />
			{/if}
			<span class="text-sm font-extrabold tabular-nums text-text-primary">{value}</span>
		</div>
	</div>
	<span class="text-xs font-semibold text-text-secondary">{label}</span>
	{#if goalLabel}
		<span class="text-[10px] text-text-tertiary">{goalLabel}</span>
	{/if}
</div>
