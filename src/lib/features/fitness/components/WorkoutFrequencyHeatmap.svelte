<script lang="ts">
	// Welle F3 — Trainingsfrequenz-Heatmap, adaptiert von habits/components/StreakCalendar.svelte
	// (gleiches Grid-/Farb-/Tooltip-Muster, aber binär: Training ja/nein statt Habit-Quote).
	import { toISODate } from '$lib/core/date';
	import { themeState } from '$lib/core/theme.svelte';

	let { logDates }: { logDates: string[] } = $props();
	const loggedSet = $derived(new Set(logDates));

	const WEEKS = 12;
	const DAYS = WEEKS * 7;

	const today = new Date();
	const gridStart = new Date(today);
	gridStart.setDate(today.getDate() - DAYS + 1);

	const allDays: string[] = Array.from({ length: DAYS }, (_, i) => {
		const d = new Date(gridStart);
		d.setDate(gridStart.getDate() + i);
		return toISODate(d);
	});

	const weeks: string[][] = [];
	for (let w = 0; w < WEEKS; w++) {
		weeks.push(allDays.slice(w * 7, w * 7 + 7));
	}

	function cellColor(dateStr: string): string {
		const isDark = themeState.isDark;
		return loggedSet.has(dateStr) ? (isDark ? '#10b981' : '#059669') : isDark ? '#1e113a' : '#f1f5f9';
	}

	const monthLabels: { week: number; label: string }[] = [];
	for (let w = 0; w < weeks.length; w++) {
		const firstDay = new Date(weeks[w][0]);
		if (firstDay.getDate() <= 7 || w === 0) {
			monthLabels.push({ week: w, label: firstDay.toLocaleDateString('de-DE', { month: 'short' }) });
		}
	}

	let tooltip = $state<string | null>(null);

	const CELL_SIZE = 11;
	const CELL_GAP = 2;
	const STEP = CELL_SIZE + CELL_GAP;
	const LABEL_HEIGHT = 16;
	const svgWidth = WEEKS * STEP;
	const svgHeight = LABEL_HEIGHT + 7 * STEP;
</script>

<div class="w-full overflow-x-auto">
	<svg
		width={svgWidth}
		height={svgHeight}
		viewBox="0 0 {svgWidth} {svgHeight}"
		aria-label="Trainings-Heatmap der letzten 12 Wochen"
	>
		{#each monthLabels as { week, label }}
			<text
				x={week * STEP}
				y={LABEL_HEIGHT - 3}
				font-size="9"
				fill="currentColor"
				class="text-text-tertiary"
				font-family="system-ui, sans-serif"
			>{label}</text>
		{/each}

		{#each weeks as week, wi}
			{#each week as dateStr, di}
				{@const isToday = dateStr === toISODate(today)}
				<rect
					x={wi * STEP}
					y={LABEL_HEIGHT + di * STEP}
					width={CELL_SIZE}
					height={CELL_SIZE}
					rx="2"
					ry="2"
					fill={cellColor(dateStr)}
					stroke={isToday ? '#059669' : 'none'}
					stroke-width={isToday ? 1.5 : 0}
					class="cursor-pointer transition-opacity hover:opacity-80"
					onmouseenter={() => (tooltip = dateStr)}
					onmouseleave={() => (tooltip = null)}
					role="gridcell"
					aria-label="{dateStr}: {loggedSet.has(dateStr) ? 'Training' : 'kein Training'}"
				/>
			{/each}
		{/each}
	</svg>

	{#if tooltip}
		<div class="mt-1 text-xs text-text-secondary">
			<span class="font-medium">
				{new Date(tooltip).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
			</span>
			— {loggedSet.has(tooltip) ? 'Training absolviert' : 'kein Training'}
		</div>
	{/if}
</div>
