<script lang="ts">
	import { fitnessState } from '#lib/features/fitness/store.svelte.js';
	import WorkoutFrequencyHeatmap from '#lib/features/fitness/components/WorkoutFrequencyHeatmap.svelte';
	import MuscleGroupVolumeChart from '#lib/features/fitness/components/MuscleGroupVolumeChart.svelte';
	import TrendChart from '#lib/features/fitness/components/TrendChart.svelte';
	import {
		currentWeekVolumeByMuscleGroup,
		weeklyCardioStats
	} from '#lib/features/fitness/utils/volume.js';
	import { healthState } from '#lib/features/health/store.svelte.js';
	import { weightTrend } from '#lib/features/health/stats.js';

	const bodyWeightKg = $derived(weightTrend(healthState.entries, 30)?.last ?? null);

	const muscleGroupVolume = $derived(
		currentWeekVolumeByMuscleGroup(fitnessState.allSetLogs, fitnessState.catalog, bodyWeightKg)
	);
	const cardioWeekly = $derived(weeklyCardioStats(fitnessState.allSetLogs));
	const cardioPacePoints = $derived(
		cardioWeekly
			.filter((w) => w.avgPaceMinPerKm !== null)
			.map((w) => ({
				label: new Date(w.weekStart).toLocaleDateString('de-DE', {
					day: '2-digit',
					month: '2-digit'
				}),
				value: Math.round((w.avgPaceMinPerKm as number) * 100) / 100
			}))
	);
	const cardioDistancePoints = $derived(
		cardioWeekly.map((w) => ({
			label: new Date(w.weekStart).toLocaleDateString('de-DE', {
				day: '2-digit',
				month: '2-digit'
			}),
			value: w.distanceKm
		}))
	);
	function formatPaceValue(v: number): string {
		const wholeMin = Math.floor(v);
		const seconds = Math.round((v - wholeMin) * 60);
		return `${wholeMin}:${String(seconds).padStart(2, '0')} /km`;
	}
</script>

<div class="space-y-6">
	<!-- Trainingsfrequenz -->
	<div class="glass-card premium-shadow rounded-2xl p-4">
		<h3 class="mb-3 text-xs font-bold tracking-wider text-text-tertiary uppercase">
			Trainingsfrequenz
		</h3>
		<WorkoutFrequencyHeatmap logDates={fitnessState.logs.map((l) => l.date)} />
	</div>

	<!-- Muskelgruppen-Volumen diese Woche -->
	<div class="glass-card premium-shadow rounded-2xl p-4">
		<h3 class="mb-3 text-xs font-bold tracking-wider text-text-tertiary uppercase">
			Wochen-Volumen nach Muskelgruppe
		</h3>
		<MuscleGroupVolumeChart data={muscleGroupVolume} />
	</div>

	<!-- Cardio-Statistik -->
	{#if cardioWeekly.length > 0}
		<div class="grid gap-4 sm:grid-cols-2">
			<div class="glass-card premium-shadow rounded-2xl p-4">
				<h3 class="mb-3 text-xs font-bold tracking-wider text-text-tertiary uppercase">
					Strecke pro Woche
				</h3>
				<TrendChart points={cardioDistancePoints} formatValue={(v) => `${v} km`} />
			</div>
			{#if cardioPacePoints.length > 0}
				<div class="glass-card premium-shadow rounded-2xl p-4">
					<h3 class="mb-3 text-xs font-bold tracking-wider text-text-tertiary uppercase">
						Pace-Trend
					</h3>
					<TrendChart points={cardioPacePoints} formatValue={formatPaceValue} />
				</div>
			{/if}
		</div>
	{/if}
</div>
