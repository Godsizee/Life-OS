<script lang="ts">
	// W8 — Zielwert-Ziel auf einen Blick: Stand, kumulativer Verlauf, Check-in-Historie.
	import { Plus, Trash2, Target, ChevronDown, ChevronUp } from 'lucide-svelte';
	import TrendChart from '$lib/features/fitness/components/TrendChart.svelte';
	import GoalCheckinSheet from './GoalCheckinSheet.svelte';
	import { goalsState } from '../store.svelte';
	import {
		benoetigtProTag,
		checkinValue,
		cumulativeSeries,
		evaluateTrack,
		formatTargetProgress,
		sumCheckins,
		targetPercent
	} from '../checkins';
	import { getGoalProgress } from '../progress';
	import { formatShortDate } from '$lib/core/date';
	import type { Goal } from '../types';

	let { goal }: { goal: Goal } = $props();

	let checkinOpen = $state(false);
	let historyOpen = $state(true);

	const checkins = $derived(goalsState.checkinsFor(goal.id));
	const sum = $derived(sumCheckins(checkins));
	const percent = $derived(targetPercent(goal.target_value, sum));
	const series = $derived(cumulativeSeries(checkins));
	const points = $derived(series.map((p) => ({ label: p.label, value: p.value })));

	const progress = $derived(getGoalProgress(goal));
	const track = $derived(evaluateTrack(goal, progress));
	const rateNeeded = $derived(
		goal.target_value ? benoetigtProTag(goal.target_value, sum, track.daysLeft) : null
	);

	const history = $derived([...checkins].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10));
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
	<div class="flex flex-wrap items-center justify-between text-[11px] text-text-tertiary">
		<span>{percent} % erreicht</span>
		{#if rateNeeded !== null && goal.target_value}
			<span class="font-medium text-text-secondary">
				Noch {Math.max(0, Math.round((goal.target_value - sum) * 100) / 100)} {goal.target_unit ?? ''} in {track.daysLeft} Tagen ({rateNeeded} {goal.target_unit ?? ''}/Tag)
			</span>
		{/if}
	</div>

	<div class="mt-3 h-2 w-full overflow-hidden rounded-full border border-border-color/20 bg-surface-2">
		<div
			class="h-full bg-primary-600 transition-all duration-500 dark:bg-primary-500"
			style="width: {percent}%"
		></div>
	</div>

	{#if hasData}
		<div class="mt-4">
			<TrendChart
				{points}
				goalLine={goal.target_value ?? undefined}
				formatValue={(v) => formatTargetProgress(v, null, goal.target_unit)}
			/>
		</div>

		<div class="mt-4 border-t border-border-color pt-3">
			<button
				onclick={() => (historyOpen = !historyOpen)}
				class="flex w-full items-center justify-between text-xs font-semibold text-text-secondary hover:text-text-primary"
			>
				<span>Letzte Check-ins ({history.length})</span>
				{#if historyOpen}
					<ChevronUp size={14} />
				{:else}
					<ChevronDown size={14} />
				{/if}
			</button>

			{#if historyOpen}
				<ul class="mt-2 flex flex-col gap-1.5">
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
			{/if}
		</div>
	{:else}
		<p class="mt-3 text-sm text-text-secondary">
			Noch kein Check-in. Trage ein, was du bereits geschafft hast.
		</p>
	{/if}
</section>

<GoalCheckinSheet {goal} bind:open={checkinOpen} />

