<script lang="ts">
	import { healthState } from '$lib/features/health/store.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import HealthForm from '$lib/features/health/components/HealthForm.svelte';
	import HealthRings from '$lib/features/health/components/HealthRings.svelte';
	import HealthTrends from '$lib/features/health/components/HealthTrends.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { formatDate } from '$lib/core/date';
	import { formatMetric, goalPercent, num } from '$lib/features/health/stats';
	import { Pencil } from 'lucide-svelte';

	$effect(() => {
		if (workspaceState.workspace?.id) {
			healthState.load();
			void profileState.load();
		}
	});

	// Liste ist bereits absteigend sortiert (neueste zuerst).
	const recent = $derived(healthState.entries.slice(0, 30));

	let sheetOpen = $state(false);
	let sheetDate = $state(healthState.todayKey());

	function edit(date: string) {
		sheetDate = date;
		sheetOpen = true;
	}
</script>

<svelte:head>
	<title>Gesundheit - Life OS</title>
</svelte:head>

<PageHeader title="Körper & Gesundheit" subtitle="Täglicher Check-in" />

<div class="flex flex-col gap-4">
	<!-- Tagesziele -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold text-text-primary">Heute</h2>
		{#if healthState.loading}
			<Skeleton height="6rem" />
		{:else}
			<HealthRings />
		{/if}
		<p class="mt-3 text-[11px] text-text-tertiary">
			Ziele änderst du unter <a href="/more" class="font-medium text-primary-active hover:underline">Mehr</a>.
		</p>
	</section>

	<!-- Erfassen -->
	<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-text-primary">Heute erfassen</h2>
		<HealthForm />
	</section>

	<!-- Trends -->
	<section>
		<h2 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-tertiary">Trends (30 Tage)</h2>
		<HealthTrends days={30} />
	</section>

	<!-- Verlauf -->
	{#if recent.length > 0}
		<section class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
			<h2 class="mb-3 text-sm font-semibold text-text-primary">Verlauf</h2>
			<div class="flex flex-col gap-2">
				{#each recent as entry (entry.id)}
					{@const water = num(entry.water_glasses)}
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
								{#if entry.weight_kg != null}<span>{formatMetric('weight_kg', num(entry.weight_kg))}</span>{/if}
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
							{#if water !== null}
								<div class="flex items-center gap-2">
									<span class="w-5 text-xs">💧</span>
									<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
										<div
											class="h-full {water >= profileState.waterGoalGlasses ? 'bg-emerald-500' : 'bg-primary-500'}"
											style="width: {goalPercent(water, profileState.waterGoalGlasses)}%"
										></div>
									</div>
									<span class="w-12 text-right text-xs text-text-secondary">{water}x</span>
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
