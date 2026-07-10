<script lang="ts">
	import type { JournalEntry } from '../types';
	import DayContextStrip from './DayContextStrip.svelte';

	let { entries }: { entries: JournalEntry[] } = $props();

	const moodEmoji: Record<string, string> = {
		great: '😄',
		good: '🙂',
		okay: '😐',
		bad: '🙁',
		terrible: '😢'
	};
</script>

<ul class="flex flex-col gap-2">
	{#each entries as entry (entry.id)}
		<li class="rounded-xl border border-border-color bg-surface-0 p-3">
			<div class="flex items-center gap-2">
				{#if entry.mood}<span class="text-lg">{moodEmoji[entry.mood] ?? ''}</span>{/if}
				<p class="text-sm font-medium text-text-primary">
					{new Date(entry.date).toLocaleDateString('de-DE', {
						weekday: 'short',
						day: '2-digit',
						month: '2-digit'
					})}
				</p>
			</div>
			{#if entry.body}
				<p class="mt-1 line-clamp-3 text-sm text-text-secondary">{entry.body}</p>
			{/if}
			{#if entry.context}
				<div class="mt-2">
					<DayContextStrip context={entry.context} />
				</div>
			{/if}
		</li>
	{:else}
		<p class="text-sm text-text-tertiary">Noch keine Einträge.</p>
	{/each}
</ul>
