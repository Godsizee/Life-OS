<script lang="ts">
	// W9 — 30-Tage-Trends je Metrik. Nutzt TrendChart aus F3 wieder
	// (kein Chart-Framework im Projekt).
	import TrendChart from '$lib/features/fitness/components/TrendChart.svelte';
	import { healthState } from '../store.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import {
		formatMetric,
		goalHitDays,
		metricAverage,
		metricSeries,
		weightTrend
	} from '../stats';
	import type { HealthMetric } from '../types';

	let { days = 30 }: { days?: number } = $props();

	const entries = $derived(healthState.entries);

	function series(metric: HealthMetric) {
		return metricSeries(entries, metric, days);
	}

	const sleepSeries = $derived(series('sleep_h'));
	const waterSeries = $derived(series('water_glasses'));
	const weightSeries = $derived(series('weight_kg'));

	const sleepAvg = $derived(metricAverage(entries, 'sleep_h', 7));
	const waterAvg = $derived(metricAverage(entries, 'water_glasses', 7));
	const sleepGoalHit = $derived(goalHitDays(entries, 'sleep_h', profileState.sleepGoalH, days));
	const waterGoalHit = $derived(
		goalHitDays(entries, 'water_glasses', profileState.waterGoalGlasses, days)
	);
	const weight = $derived(weightTrend(entries, days));
</script>

<div class="flex flex-col gap-4">
	<!-- Schlaf -->
	<div class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<div class="mb-2 flex items-baseline justify-between gap-3">
			<h3 class="text-sm font-semibold text-text-primary">😴 Schlaf</h3>
			<span class="text-xs text-text-secondary">
				Ø 7 Tage: <span class="font-bold text-text-primary">{formatMetric('sleep_h', sleepAvg)}</span>
			</span>
		</div>
		<TrendChart points={sleepSeries} formatValue={(v) => formatMetric('sleep_h', v)} />
		{#if sleepGoalHit.tracked > 0}
			<p class="mt-2 text-[11px] text-text-tertiary">
				Ziel ({profileState.sleepGoalH} h) an {sleepGoalHit.hit} von {sleepGoalHit.tracked} erfassten Tagen erreicht.
			</p>
		{/if}
	</div>

	<!-- Wasser -->
	<div class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<div class="mb-2 flex items-baseline justify-between gap-3">
			<h3 class="text-sm font-semibold text-text-primary">💧 Wasser</h3>
			<span class="text-xs text-text-secondary">
				Ø 7 Tage: <span class="font-bold text-text-primary">{formatMetric('water_glasses', waterAvg)}</span>
			</span>
		</div>
		<TrendChart points={waterSeries} formatValue={(v) => formatMetric('water_glasses', v)} />
		{#if waterGoalHit.tracked > 0}
			<p class="mt-2 text-[11px] text-text-tertiary">
				Ziel ({profileState.waterGoalGlasses} Gläser) an {waterGoalHit.hit} von {waterGoalHit.tracked} erfassten Tagen erreicht.
			</p>
		{/if}
	</div>

	<!-- Gewicht -->
	{#if weightSeries.length > 0}
		<div class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
			<div class="mb-2 flex items-baseline justify-between gap-3">
				<h3 class="text-sm font-semibold text-text-primary">⚖️ Gewicht</h3>
				{#if weight}
					<span
						class="text-xs font-bold {weight.delta < 0
							? 'text-emerald-600 dark:text-emerald-400'
							: weight.delta > 0
								? 'text-amber-600 dark:text-amber-400'
								: 'text-text-secondary'}"
					>
						{weight.delta > 0 ? '+' : ''}{String(weight.delta).replace('.', ',')} kg in {days} Tagen
					</span>
				{/if}
			</div>
			<TrendChart points={weightSeries} formatValue={(v) => formatMetric('weight_kg', v)} />
		</div>
	{/if}
</div>
