<script lang="ts">
	// W8 — Zielwert-Ziel auf einen Blick: Stand, kumulativer Verlauf, Check-in-Historie.
	import { Plus, Trash2, Target } from 'lucide-svelte';
	import TrendChart from '$lib/features/fitness/components/TrendChart.svelte';
	import GoalCheckinSheet from './GoalCheckinSheet.svelte';
	import { goalsState } from '../store.svelte';
	import {
		checkinValue,
		cumulativePoints,
		formatTargetProgress,
		sumCheckins,
		targetPercent
	} from '../checkins';
	import { formatShortDate } from '$lib/core/date';
	import type { Goal } from '../types';

	let { goal }: { goal: Goal } = $props();

	let checkinOpen = $state(false);

	const checkins = $derived(goalsState.checkinsFor(goal.id));
	const sum = $derived(sumCheckins(checkins));
	const percent = $derived(targetPercent(goal.target_value, sum));
	const points = $derived(
		cumulativePoints(checkins, 30).map((p) => ({ label: p.label, value: p.value }))
	);
	const history = $derived([...checkins].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8));
	const hasData = $derived(checkins.length > 0);
</script>

<section class="glass-card rounded-2xl p-4 premium-shadow">
	<div class="mb-3 flex items-center justify-between gap-2">
		<h2 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
			<Target size={14} /> Zielwert
		</h2>
		<button
			onclick={() => (checkinOpen = true)}
			class="inline-flex min-h-9 items-center gap-1 rounded-full bg-primary-600 px-3 text-xs font-bold text-white active:scale-95 transition-transform"
		>
			<Plus size={14} /> Check-in
		</button>
	</div>

	<p class="text-2xl font-extrabold tabular-nums text-text-primary">
		{formatTargetProgress(sum, goal.target_value, goal.target_unit)}
	</p>
	<p class="text-[11px] text-text-tertiary">{percent} % erreicht</p>

	<div class="mt-3 h-2 w-full overflow-hidden rounded-full border border-border-color/20 bg-surface-2">
		<div
			class="h-full bg-primary-600 transition-all duration-500 dark:bg-primary-500"
			style="width: {percent}%"
		></div>
	</div>

	{#if hasData}
		<div class="mt-4">
			<TrendChart {points} formatValue={(v) => formatTargetProgress(v, null, goal.target_unit)} />
		</div>

		<ul class="mt-4 flex flex-col gap-1.5 border-t border-border-color pt-3">
			{#each history as c (c.id)}
				<li class="flex items-center gap-2">
					<span class="w-20 shrink-0 text-xs tabular-nums text-text-tertiary">
						{formatShortDate(c.date)}
					</span>
					<span class="shrink-0 text-xs font-bold tabular-nums text-text-primary">
						+{checkinValue(c)}
					</span>
					<span class="min-w-0 flex-1 truncate text-xs text-text-secondary">{c.note ?? ''}</span>
					<button
						onclick={() => goalsState.removeCheckin(c.id)}
						aria-label="Check-in löschen"
						class="shrink-0 p-1 text-text-tertiary active:text-red-600 dark:active:text-red-400"
					>
						<Trash2 size={14} />
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="mt-3 text-sm text-text-secondary">
			Noch kein Check-in. Trage ein, was du bereits geschafft hast.
		</p>
	{/if}
</section>

<GoalCheckinSheet {goal} bind:open={checkinOpen} />
