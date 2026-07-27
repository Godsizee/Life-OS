<script lang="ts">
	// W9 — Ø-Stimmung je Wochentag. Reine Balken, kein SVG noetig.
	import { averageByWeekday, formatScore, WEEKDAY_SHORT, type MoodLike } from '../stats';
	import { moodHex } from '../colors';
	import { themeState } from '$lib/core/theme.svelte';

	let { entries }: { entries: MoodLike[] } = $props();

	const averages = $derived(averageByWeekday(entries));
	const hasData = $derived(averages.some((a) => a !== null));
</script>

{#if hasData}
	<div class="flex items-end justify-between gap-1.5" style="height: 96px;">
		{#each averages as avg, i}
			<div class="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
				<span class="text-[10px] tabular-nums text-text-tertiary">{formatScore(avg)}</span>
				<div
					class="w-full rounded-t-md transition-all"
					style="height: {avg === null ? 2 : Math.max(4, (avg / 5) * 60)}px; background-color: {avg === null
						? 'transparent'
						: moodHex(Math.round(avg), themeState.isDark)}"
				></div>
				<span class="text-[10px] font-semibold text-text-secondary">{WEEKDAY_SHORT[i]}</span>
			</div>
		{/each}
	</div>
{/if}
