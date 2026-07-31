<script lang="ts">
	import { moodDistribution, type MoodLike } from '../stats';
	import { MOOD_LABELS, MOOD_EMOJIS } from '../types';
	import { MOOD_CLASSES } from '../colors';

	let { entries }: { entries: MoodLike[] } = $props();

	const dist = $derived(moodDistribution(entries));
	const total = $derived(dist.reduce((a, b) => a + b, 0));
</script>

<div class="space-y-2">
	<h3 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">
		Stimmungs-Verteilung
	</h3>

	{#if total === 0}
		<p class="text-xs text-text-tertiary">Keine Daten im Zeitraum.</p>
	{:else}
		<div class="flex flex-col gap-2">
			{#each [5, 4, 3, 2, 1] as score (score)}
				{@const count = dist[score - 1]}
				{@const percent = Math.round((count / total) * 100)}
				<div class="flex items-center gap-2 text-xs">
					<span class="w-24 shrink-0 font-medium text-text-secondary truncate">
						{MOOD_EMOJIS[score]} {MOOD_LABELS[score]}
					</span>
					<div class="h-3.5 flex-1 overflow-hidden rounded-full bg-surface-2 border border-border-color/20">
						<div
							class="h-full transition-all duration-500 {MOOD_CLASSES[score]}"
							style="width: {percent}%"
						></div>
					</div>
					<span class="w-12 shrink-0 text-right tabular-nums text-text-tertiary">
						{count} ({percent}%)
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
