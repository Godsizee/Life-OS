<script lang="ts">
	let { scores = [] }: { scores: number[] } = $props();

	// If less than 7 elements, pad with 0s
	const paddedScores = $derived(
		scores.length >= 7 
			? scores.slice(-7) 
			: Array(7 - scores.length).fill(0).concat(scores)
	);

	// Generate SVG points based on scores
	const width = 140;
	const height = 40;
	const points = $derived(
		paddedScores
			.map((score, i) => {
				const x = (i / 6) * width;
				const y = height - (score / 100) * (height - 6) - 3;
				return `${x},${y}`;
			})
			.join(' ')
	);

	const trend = $derived((): 'up' | 'down' | 'neutral' => {
		if (scores.length < 2) return 'neutral';
		const last = scores[scores.length - 1];
		const prev = scores[scores.length - 2];
		return last > prev ? 'up' : last < prev ? 'down' : 'neutral';
	});
</script>

<div class="flex items-center gap-3">
	<!-- Sparkline Line Chart -->
	<svg width={width} height={height} class="overflow-visible">
		{#if points}
			<polyline
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-primary-600 dark:text-primary-400"
				{points}
			/>
			
			<!-- Dots for each point -->
			{#each paddedScores as score, i}
				{@const x = (i / 6) * width}
				{@const y = height - (score / 100) * (height - 6) - 3}
				<circle
					cx={x}
					cy={y}
					r="3.5"
					class="fill-surface-0 stroke-primary-600 stroke-[2px] dark:stroke-primary-400"
				/>
			{/each}
		{/if}
	</svg>

	<!-- Trend Indicator -->
	<div class="flex items-center gap-1">
		{#if trend() === 'up'}
			<span class="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600 dark:bg-primary-950/30 dark:text-primary-400">
				↑
			</span>
		{:else}
			{@const down = trend() === 'down'}
			<span class="flex h-6 w-6 items-center justify-center rounded-lg {down ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400' : 'bg-surface-2 text-text-secondary'} text-xs font-bold">
				{down ? '↓' : '→'}
			</span>
		{/if}
	</div>
</div>
