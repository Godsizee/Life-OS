<script lang="ts">
	import type { Kennzahl } from '$lib/features/analytics/week-compare';
	import type { Task } from '$lib/features/tasks/types';
	import type { Goal, JournalEntry } from '$lib/features/goals/types';
	import { evaluateTrack } from '$lib/features/goals/checkins';
	import { getGoalProgress } from '$lib/features/goals/progress';
	import OnTrackBadge from '$lib/features/goals/components/OnTrackBadge.svelte';
	import StatCard from '$lib/features/analytics/components/StatCard.svelte';

	let {
		kennzahlen,
		focusLetzteWoche,
		goalsInProgress,
		letzterReview,
		tageSeitReview,
		onNext
	}: {
		kennzahlen: Kennzahl[];
		focusLetzteWoche: Task[];
		goalsInProgress: Goal[];
		letzterReview: JournalEntry | undefined;
		tageSeitReview: number | null;
		onNext: () => void;
	} = $props();
</script>

<section class="flex flex-col gap-4">
	<div class="flex items-center justify-between gap-2">
		<h2 class="text-lg font-semibold text-text-primary">Diese Woche im Rückblick</h2>
		{#if letzterReview && tageSeitReview !== null}
			<a href="/journal?kind=weekly" class="shrink-0 text-xs text-text-tertiary hover:text-text-secondary">
				Letzter Review: vor {tageSeitReview} {tageSeitReview === 1 ? 'Tag' : 'Tagen'}
			</a>
		{/if}
	</div>

	{#if focusLetzteWoche.length > 0}
		<div class="rounded-xl border border-border-color bg-surface-0 p-4">
			<p class="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
				Dein Fokus letzte Woche
			</p>
			<ul class="mt-2 flex flex-col gap-1.5">
				{#each focusLetzteWoche as t (t.id)}
					<li class="flex items-center gap-2 text-sm">
						<span class={t.status === 'done' ? 'text-emerald-500' : 'text-text-tertiary'}>
							{t.status === 'done' ? '✓' : '○'}
						</span>
						<span
							class="min-w-0 flex-1 truncate {t.status === 'done'
								? 'text-text-tertiary line-through'
								: 'text-text-primary'}"
						>
							{t.title}
						</span>
					</li>
				{/each}
			</ul>
			<p class="mt-2 text-xs text-text-secondary">
				{focusLetzteWoche.filter((t) => t.status === 'done').length} von {focusLetzteWoche.length} geschafft.
			</p>
		</div>
	{/if}

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
		{#each kennzahlen as k (k.id)}
			<StatCard kennzahl={k} />
		{/each}
	</div>

	{#if goalsInProgress.length > 0}
		<div class="rounded-xl border border-border-color bg-surface-0 p-4">
			<p class="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Ziele</p>
			<div class="mt-2 flex flex-col gap-2">
				{#each goalsInProgress as goal (goal.id)}
					{@const progress = getGoalProgress(goal)}
					{@const track = evaluateTrack(goal, progress)}
					<div class="flex items-center gap-2">
						<span class="min-w-0 flex-1 truncate text-sm text-text-secondary">{goal.title}</span>
						<OnTrackBadge {track} compact />
						<div class="w-16 shrink-0">
							<div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
								<div class="h-full bg-primary-500" style="width: {progress}%"></div>
							</div>
						</div>
						<span class="w-8 text-right text-xs text-text-secondary">{progress}%</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<button
		onclick={onNext}
		class="mt-2 min-h-12 rounded-xl bg-primary-600 text-sm font-medium text-white active:bg-primary-700"
	>
		Weiter →
	</button>
</section>
