<script lang="ts">
	// W9 — „Womit haengt gute Stimmung zusammen?" (Daylio-Kern-Auswertung).
	// Wird auf /mood UND /analytics eingehaengt.
	import { ThumbsDown, ThumbsUp } from 'lucide-svelte';
	import { activityLabel } from '../activities';
	import { activityStats, formatDelta, formatScore, topActivities, type MoodLike } from '../stats';

	let {
		entries,
		limit = 5,
		minCount = 3
	}: {
		entries: MoodLike[];
		limit?: number;
		minCount?: number;
	} = $props();

	const stats = $derived(activityStats(entries, minCount));
	const good = $derived(topActivities(stats, 'good', limit));
	const bad = $derived(topActivities(stats, 'bad', limit));
	const hasData = $derived(stats.length > 0);
</script>

{#if !hasData}
	<div class="rounded-2xl border border-dashed border-border-color px-4 py-6 text-center">
		<p class="text-sm text-text-secondary">
			Tagge deine Stimmung mit Aktivitäten — ab {minCount} Tagen je Aktivität siehst du hier,
			was deine Stimmung hebt oder drückt.
		</p>
	</div>
{:else}
	<div class="grid gap-3 sm:grid-cols-2">
		<div class="rounded-2xl border border-border-color bg-surface-0 p-4">
			<p class="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-tertiary">
				<ThumbsUp size={12} class="text-emerald-500" /> Hebt die Stimmung
			</p>
			{#if good.length === 0}
				<p class="text-xs text-text-tertiary">Noch kein klarer Zusammenhang.</p>
			{:else}
				<ul class="flex flex-col gap-1.5">
					{#each good as stat (stat.id)}
						<li class="flex items-center justify-between gap-2 text-sm">
							<span class="min-w-0 truncate text-text-primary">{activityLabel(stat.id)}</span>
							<span class="flex shrink-0 items-center gap-2 tabular-nums">
								<span class="text-xs text-text-tertiary">{stat.count}x</span>
								<span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">
									{formatDelta(stat.delta)}
								</span>
								<span class="w-7 text-right text-xs text-text-secondary">{formatScore(stat.avg)}</span>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="rounded-2xl border border-border-color bg-surface-0 p-4">
			<p class="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-tertiary">
				<ThumbsDown size={12} class="text-red-500" /> Drückt die Stimmung
			</p>
			{#if bad.length === 0}
				<p class="text-xs text-text-tertiary">Noch kein klarer Zusammenhang.</p>
			{:else}
				<ul class="flex flex-col gap-1.5">
					{#each bad as stat (stat.id)}
						<li class="flex items-center justify-between gap-2 text-sm">
							<span class="min-w-0 truncate text-text-primary">{activityLabel(stat.id)}</span>
							<span class="flex shrink-0 items-center gap-2 tabular-nums">
								<span class="text-xs text-text-tertiary">{stat.count}x</span>
								<span class="text-xs font-bold text-red-600 dark:text-red-400">
									{formatDelta(stat.delta)}
								</span>
								<span class="w-7 text-right text-xs text-text-secondary">{formatScore(stat.avg)}</span>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
	<p class="mt-2 px-1 text-[11px] text-text-tertiary">
		Ø-Stimmung an Tagen mit dieser Aktivität, verglichen mit deinem Gesamtdurchschnitt.
		Erst ab {minCount} Tagen je Aktivität.
	</p>
{/if}
