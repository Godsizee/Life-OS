<script lang="ts">
	import { healthState } from '../store.svelte';
	import { sleepEnergyBuckets } from '../stats';

	let { days = 90 }: { days?: number } = $props();

	const entries = $derived(healthState.entries);
	const buckets = $derived(sleepEnergyBuckets(entries, days));
</script>

<div class="rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
	<h3 class="mb-3 text-sm font-semibold text-text-primary">Schlaf ↔ Energie ({days} T)</h3>
	{#if buckets.length > 0}
		<div class="flex flex-col gap-2">
			{#each buckets as b}
				<div class="flex items-center gap-3">
					<span class="w-16 shrink-0 text-xs text-text-secondary">{b.label}</span>
					<div class="flex-1 h-3 rounded-full bg-surface-2 overflow-hidden">
						<div class="h-full bg-amber-500 rounded-full" style="width: {(b.avgEnergy / 5) * 100}%"></div>
					</div>
					<span class="w-12 text-right text-xs font-bold text-text-primary">{b.avgEnergy}</span>
					<span class="w-12 text-right text-[10px] text-text-tertiary">({b.days} T)</span>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-xs text-text-tertiary">Zu wenig Daten für eine Korrelation.</p>
	{/if}
</div>
