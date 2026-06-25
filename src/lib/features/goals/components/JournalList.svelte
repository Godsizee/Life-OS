<script lang="ts">
	import type { JournalEntry } from '../types';

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
		<li class="rounded-xl border border-slate-200 bg-white p-3">
			<div class="flex items-center gap-2">
				{#if entry.mood}<span class="text-lg">{moodEmoji[entry.mood] ?? ''}</span>{/if}
				<p class="text-sm font-medium text-slate-700">
					{new Date(entry.date).toLocaleDateString('de-DE', {
						weekday: 'short',
						day: '2-digit',
						month: '2-digit'
					})}
				</p>
			</div>
			{#if entry.body}
				<p class="mt-1 line-clamp-3 text-sm text-slate-500">{entry.body}</p>
			{/if}
		</li>
	{:else}
		<p class="text-sm text-slate-500">Noch keine Einträge.</p>
	{/each}
</ul>
