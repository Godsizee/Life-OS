<script lang="ts">
	// W9 — Daylio „Year in Pixels": 12 Monatsspalten x 31 Tageszeilen.
	// Handgerolltes Inline-SVG (kein Chart-Framework im Projekt),
	// Muster: fitness/components/WorkoutFrequencyHeatmap.svelte.
	import { themeState } from '$lib/core/theme.svelte';
	import { moodHex } from '../colors';
	import { MOOD_LABELS } from '../types';
	import { formatDate } from '$lib/core/date';
	import type { PixelMonth } from '../stats';

	let {
		months,
		onselect
	}: {
		months: PixelMonth[];
		onselect?: (date: string) => void;
	} = $props();

	const CELL = 10;
	const GAP = 2;
	const STEP = CELL + GAP;
	const LABEL_H = 16;
	const ROW_LABEL_W = 16;

	const width = ROW_LABEL_W + 12 * STEP;
	const height = LABEL_H + 31 * STEP;

	let hovered = $state<{ date: string; score: number | null } | null>(null);

	function cellFill(score: number | null, future: boolean): string {
		if (future) return 'transparent';
		return moodHex(score, themeState.isDark);
	}
</script>

<div class="w-full overflow-x-auto">
	<svg
		{width}
		{height}
		viewBox="0 0 {width} {height}"
		role="grid"
		aria-label="Stimmung im Jahresverlauf"
	>
		{#each months as month (month.month)}
			<text
				x={ROW_LABEL_W + month.month * STEP + CELL / 2}
				y={LABEL_H - 5}
				font-size="8"
				text-anchor="middle"
				fill="currentColor"
				class="text-text-tertiary"
				font-family="system-ui, sans-serif">{month.label}</text
			>
		{/each}

		{#each [1, 8, 15, 22, 29] as day}
			<text
				x={ROW_LABEL_W - 4}
				y={LABEL_H + (day - 1) * STEP + CELL - 1}
				font-size="7"
				text-anchor="end"
				fill="currentColor"
				class="text-text-faint"
				font-family="system-ui, sans-serif">{day}</text
			>
		{/each}

		{#each months as month (month.month)}
			{#each month.days as cell, row}
				{#if cell}
					<rect
						x={ROW_LABEL_W + month.month * STEP}
						y={LABEL_H + row * STEP}
						width={CELL}
						height={CELL}
						rx="2"
						ry="2"
						fill={cellFill(cell.score, cell.future)}
						stroke={cell.future ? 'currentColor' : 'none'}
						stroke-width={cell.future ? 0.5 : 0}
						class="cursor-pointer text-border-color transition-opacity hover:opacity-70"
						role="gridcell"
						tabindex="-1"
						aria-label="{cell.date}: {cell.score ? MOOD_LABELS[cell.score] : 'kein Eintrag'}"
						onmouseenter={() => (hovered = { date: cell.date, score: cell.score })}
						onmouseleave={() => (hovered = null)}
						onclick={() => !cell.future && onselect?.(cell.date)}
					/>
				{/if}
			{/each}
		{/each}
	</svg>
</div>

{#if hovered}
	<p class="mt-1 text-xs text-text-secondary">
		<span class="font-medium text-text-primary">
			{formatDate(hovered.date, { day: 'numeric', month: 'long' })}
		</span>
		— {hovered.score ? MOOD_LABELS[hovered.score] : 'kein Eintrag'}
	</p>
{/if}
