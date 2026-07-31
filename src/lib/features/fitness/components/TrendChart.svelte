<script lang="ts">
	// Welle F3 — generischer Inline-SVG-Linienchart (kein Chart-Framework im Projekt,
	// Muster analog analytics/components/WeekSparkline.svelte, nur für variable Punktzahl).
	let {
		points,
		overlay,
		goalLine,
		formatValue = (v: number) => String(v)
	}: {
		points: { label: string; value: number }[];
		overlay?: { label: string; value: number }[];
		goalLine?: number;
		formatValue?: (v: number) => string;
	} = $props();

	const WIDTH = 320;
	const HEIGHT = 72;
	const PAD_Y = 8;

	const allVals = $derived([
		...points.map(p => p.value),
		...(overlay ? overlay.map(p => p.value) : []),
		...(goalLine !== undefined ? [goalLine] : [])
	]);
	const maxVal = $derived(allVals.length ? Math.max(...allVals) : 1);
	const minVal = $derived(allVals.length ? Math.min(...allVals, 0) : 0);
	const range = $derived(Math.max(maxVal - minVal, 1));

	function x(i: number): number {
		return points.length <= 1 ? WIDTH / 2 : (i / (points.length - 1)) * WIDTH;
	}
	function y(v: number): number {
		return HEIGHT - PAD_Y - ((v - minVal) / range) * (HEIGHT - PAD_Y * 2);
	}
	const linePoints = $derived(points.map((p, i) => `${x(i)},${y(p.value)}`).join(' '));
	const overlayPoints = $derived(overlay ? overlay.map((p, i) => `${x(i)},${y(p.value)}`).join(' ') : null);

	let hoverIndex = $state<number | null>(null);
	const shown = $derived(hoverIndex !== null ? points[hoverIndex] : points[points.length - 1]);
</script>

{#if points.length === 0}
	<p class="text-xs text-text-tertiary">Noch keine Daten.</p>
{:else}
	<div class="w-full overflow-x-auto">
		<svg
			width={WIDTH}
			height={HEIGHT}
			viewBox="0 0 {WIDTH} {HEIGHT}"
			class="overflow-visible"
			aria-label="Verlaufsdiagramm"
		>
			<polyline
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-primary-600 dark:text-primary-400"
				points={linePoints}
			/>
			{#if overlayPoints}
				<polyline
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-dasharray="4"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-indigo-400 dark:text-indigo-600 opacity-60"
					points={overlayPoints}
				/>
			{/if}
			{#if goalLine !== undefined}
				<line
					x1="0"
					y1={y(goalLine)}
					x2={WIDTH}
					y2={y(goalLine)}
					stroke="currentColor"
					stroke-width="1"
					stroke-dasharray="2"
					class="text-text-tertiary"
				/>
			{/if}
			{#each points as p, i}
				<circle
					cx={x(i)}
					cy={y(p.value)}
					r={hoverIndex === i ? 4 : 2.5}
					class="fill-surface-0 stroke-primary-600 stroke-[1.5px] dark:stroke-primary-400 cursor-pointer transition-all"
					onmouseenter={() => (hoverIndex = i)}
					onmouseleave={() => (hoverIndex = null)}
					role="img"
					aria-label="{p.label}: {formatValue(p.value)}"
				/>
			{/each}
		</svg>
	</div>
	{#if shown}
		<p class="mt-1 text-xs text-text-secondary">
			<span class="font-semibold text-text-primary">{shown.label}</span>
			— {formatValue(shown.value)}
		</p>
	{/if}
{/if}
