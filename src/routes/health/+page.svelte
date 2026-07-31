<script lang="ts">
	import { healthState } from '$lib/features/health/store.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import HealthForm from '$lib/features/health/components/HealthForm.svelte';
	import HealthRings from '$lib/features/health/components/HealthRings.svelte';
	import HealthTrends from '$lib/features/health/components/HealthTrends.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { formatDate } from '$lib/core/date';
	import { formatMetric, goalPercent, num, waterMl } from '$lib/features/health/stats';
	import { Pencil, Settings, Calendar } from 'lucide-svelte';
	import HealthGoalsSheet from '$lib/features/health/components/HealthGoalsSheet.svelte';
	import SleepEnergyCard from '$lib/features/health/components/SleepEnergyCard.svelte';

	// Laden/Entladen liegt zentral in core/workspace-data.ts (+layout.svelte).

	// Liste ist bereits absteigend sortiert (neueste zuerst).
	const recent = $derived(healthState.entries.slice(0, 30));

	let sheetOpen = $state(false);
	let sheetDate = $state(healthState.todayKey());
	let goalsOpen = $state(false);
	
	let captureDate = $state(healthState.todayKey());

	function edit(date: string) {
		sheetDate = date;
		sheetOpen = true;
	}

	const missingDays = $derived.by(() => {
		const out = [];
		const today = new Date();
		for (let i = 1; i <= 14; i++) {
			const d = new Date(today);
			d.setDate(today.getDate() - i);
			const iso = d.toISOString().split('T')[0];
			if (!healthState.entries.find((e) => e.date === iso)) {
				out.push(iso);
			}
		}
		return out;
	});
</script>

<svelte:head>
	<title>Gesundheit - Life OS</title>
</svelte:head>

<PageHeader title="Körper & Gesundheit" subtitle="Täglicher Check-in" />

<div class="flex flex-col gap-4">
	<!-- Tagesziele -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-text-primary">Heute</h2>
			<button onclick={() => (goalsOpen = true)} class="p-1 text-text-secondary hover:text-text-primary transition-colors">
				<Settings size={16} />
			</button>
		</div>
		{#if healthState.loading}
			<Skeleton height="6rem" />
		{:else}
			<HealthRings />
		{/if}
	</section>

	<!-- Erfassen -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-text-primary">Erfassen</h2>
			<div class="flex items-center gap-2">
				<Calendar size={14} class="text-text-tertiary" />
				<input type="date" bind:value={captureDate} class="bg-transparent text-sm text-text-secondary outline-none cursor-pointer" />
			</div>
		</div>
		
		{#if missingDays.length > 0}
			<div class="mb-4 flex flex-wrap gap-1.5">
				<span class="text-xs text-text-tertiary mr-1 flex items-center">Lücken füllen:</span>
				{#each missingDays as md}
					<button 
						onclick={() => (captureDate = md)}
						class="rounded border border-border-color bg-surface-1 px-1.5 py-0.5 text-[10px] text-text-secondary transition-all hover:bg-surface-2"
					>
						{formatDate(md, { day: '2-digit', month: '2-digit' })}
					</button>
				{/each}
			</div>
		{/if}

		<HealthForm date={captureDate} onsaved={() => { captureDate = healthState.todayKey(); }} />
	</section>

	<SleepEnergyCard days={90} />

	<!-- Trends -->
	<section>
		<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">Trends</h2>
		<HealthTrends />
	</section>

	<!-- Verlauf -->
	{#if recent.length > 0}
		<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
			<h2 class="mb-3 text-sm font-semibold text-text-primary">Verlauf</h2>
			<div class="flex flex-col gap-2">
				{#each recent as entry (entry.id)}
					{@const waterVal = waterMl(entry)}
					{@const sleep = num(entry.sleep_h)}
					<button
						type="button"
						onclick={() => edit(entry.date)}
						class="rounded-lg border border-border-color/30 bg-surface-2 p-2 text-left transition-colors hover:bg-surface-3"
					>
						<div class="flex items-center justify-between gap-2">
							<span class="text-xs font-medium text-text-primary">
								{formatDate(entry.date, { weekday: 'short', day: 'numeric', month: 'short' })}
							</span>
							<span class="flex items-center gap-2 text-xs text-text-secondary">
								{#if entry.energy != null}<span>⚡{entry.energy}/5</span>{/if}
								{#if entry.weight_kg != null}<span>{formatMetric('weight_kg', num(entry.weight_kg), { weightUnit: profileState.weightUnit })}</span>{/if}
								<Pencil size={11} class="text-text-faint" />
							</span>
						</div>
						<div class="mt-1.5 flex flex-col gap-1">
							{#if sleep !== null}
								<div class="flex items-center gap-2">
									<span class="w-5 text-xs">😴</span>
									<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
										<div
											class="h-full {sleep >= profileState.sleepGoalH ? 'bg-emerald-500' : 'bg-primary-400'}"
											style="width: {goalPercent(sleep, profileState.sleepGoalH)}%"
										></div>
									</div>
									<span class="w-12 text-right text-xs text-text-secondary">{formatMetric('sleep_h', sleep)}</span>
								</div>
							{/if}
							{#if waterVal !== null}
								<div class="flex items-center gap-2">
									<span class="w-5 text-xs">💧</span>
									<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
										<div
											class="h-full {waterVal >= profileState.waterGoalMl ? 'bg-emerald-500' : 'bg-primary-500'}"
											style="width: {goalPercent(waterVal, profileState.waterGoalMl)}%"
										></div>
									</div>
									<span class="w-20 text-right text-xs text-text-secondary">{formatMetric('water_ml', waterVal, { waterUnit: profileState.waterUnit, glassSizeMl: profileState.glassSizeMl })}</span>
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</section>
	{/if}
</div>

<Sheet bind:open={sheetOpen} title={formatDate(sheetDate)}>
	<div class="px-4 pb-6">
		<HealthForm date={sheetDate} onsaved={() => (sheetOpen = false)} />
	</div>
</Sheet>

<HealthGoalsSheet bind:open={goalsOpen} />
