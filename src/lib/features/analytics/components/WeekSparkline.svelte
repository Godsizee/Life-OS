<script lang="ts">
	import type { ScorePoint } from '../score-math';
	import { scoreAverage } from '../score-math';

	let { scores = [] }: { scores: ScorePoint[] } = $props();

	const width = 140;
	const height = 40;

	// Build the SVG path (M for move, L for line) to break on nulls
	const pathData = $derived(() => {
		if (scores.length === 0) return '';
		let d = '';
		let isDrawing = false;
		
		for (let i = 0; i < scores.length; i++) {
			const s = scores[i];
			if (s.total === null) {
				isDrawing = false;
				continue;
			}
			const x = (i / (scores.length - 1 || 1)) * width;
			const y = height - (s.total / 100) * (height - 6) - 3;
			
			if (!isDrawing) {
				d += ` M ${x},${y}`;
				isDrawing = true;
			} else {
				d += ` L ${x},${y}`;
			}
		}
		return d.trim();
	});

	const stats = $derived(scoreAverage(scores));
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-3">
		<!-- Sparkline Line Chart -->
		<svg {width} {height} class="overflow-visible">
			<path
				d={pathData()}
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-primary-600 dark:text-primary-400"
			/>
			
			<!-- Dots for each valid point -->
			{#each scores as s, i}
				{#if s.total !== null}
					{@const x = (i / (scores.length - 1 || 1)) * width}
					{@const y = height - (s.total / 100) * (height - 6) - 3}
					<circle
						cx={x}
						cy={y}
						r="3.5"
						class="fill-surface-0 stroke-primary-600 stroke-[2px] dark:stroke-primary-400"
					/>
				{/if}
			{/each}
		</svg>
	</div>

	<p class="text-[11px] text-text-tertiary">
		Ø {stats.avg} über {stats.tracked} von {stats.total} Tagen
		{#if stats.tracked < stats.total}· {stats.total - stats.tracked} Tage ohne Erfassung{/if}
	</p>
</div>
