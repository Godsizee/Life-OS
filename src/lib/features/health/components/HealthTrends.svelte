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
		movingAverage,
		weightTrend
	} from '../stats';
	import type { HealthMetric } from '../types';

	let days = $state(30);

	const entries = $derived(healthState.entries);

	function series(metric: HealthMetric) {
		return metricSeries(entries, metric, days);
	}

	const sleepSeries = $derived(series('sleep_h'));
	const waterSeries = $derived(series('water_ml'));
	const energySeries = $derived(series('energy'));
	const weightSeries = $derived(series('weight_kg'));
	const weightSmoothed = $derived(movingAverage(weightSeries, 7));

	const sleepAvg = $derived(metricAverage(entries, 'sleep_h', 7));
	const waterAvg = $derived(metricAverage(entries, 'water_ml', 7));
	const energyAvg = $derived(metricAverage(entries, 'energy', 7));
	const sleepGoalHit = $derived(goalHitDays(entries, 'sleep_h', profileState.sleepGoalH, days));
	const waterGoalHit = $derived(
		goalHitDays(entries, 'water_ml', profileState.waterGoalMl, days)
	);
	const weight = $derived(weightTrend(entries, days));
</script>

<div class="flex flex-col gap-4">
	<!-- Zeitraum-Schalter -->
	<div class="flex justify-center mb-2">
		<div class="inline-flex rounded-lg border border-border-color bg-surface-1 p-1">
			{#each [30, 90, 365] as d}
				<button
					type="button"
					onclick={() => (days = d)}
					class="rounded-md px-3 py-1 text-sm font-medium transition-all {days === d ? 'bg-surface-0 shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}"
				>
					{d} T
				</button>
			{/each}
		</div>
	</div>

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
				Ø 7 Tage: <span class="font-bold text-text-primary">{formatMetric('water_ml', waterAvg, { waterUnit: profileState.waterUnit, glassSizeMl: profileState.glassSizeMl })}</span>
			</span>
		</div>
		<TrendChart points={waterSeries} formatValue={(v) => formatMetric('water_ml', v, { waterUnit: profileState.waterUnit, glassSizeMl: profileState.glassSizeMl })} />
		{#if waterGoalHit.tracked > 0}
			<p class="mt-2 text-[11px] text-text-tertiary">
				Ziel ({profileState.waterUnit === 'ml' ? profileState.waterGoalMl + ' ml' : profileState.waterGoalGlasses + ' Gläser'}) an {waterGoalHit.hit} von {waterGoalHit.tracked} erfassten Tagen erreicht.
			</p>
		{/if}
	</div>

	<!-- Energie -->
	<div class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<div class="mb-2 flex items-baseline justify-between gap-3">
			<h3 class="text-sm font-semibold text-text-primary">⚡ Energie</h3>
			<span class="text-xs text-text-secondary">
				Ø 7 Tage: <span class="font-bold text-text-primary">{formatMetric('energy', energyAvg)}</span>
			</span>
		</div>
		<TrendChart points={energySeries} formatValue={(v) => formatMetric('energy', v)} />
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
			<TrendChart 
				points={weightSeries} 
				overlay={weightSmoothed}
				goalLine={profileState.weightGoalKg ?? undefined}
				formatValue={(v) => formatMetric('weight_kg', v, { weightUnit: profileState.weightUnit })} 
			/>
		</div>
	{/if}
</div>
