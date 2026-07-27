<script lang="ts">
	import { History } from 'lucide-svelte';
	import type { JournalEntry } from '../types';

	let { entries, onOpen }: { entries: JournalEntry[]; onOpen: (e: JournalEntry) => void } =
		$props();
</script>

{#if entries.length > 0}
	<section class="rounded-2xl border border-border-color bg-surface-0 p-4 premium-shadow">
		<h2 class="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-tertiary">
			<History size={14} /> An diesem Tag
		</h2>
		<ul class="flex flex-col gap-2">
			{#each entries as entry (entry.id)}
				{@const year = entry.date.split('-')[0]}
				<li>
					<button
						class="flex w-full items-center justify-between rounded-xl border border-border-color/50 bg-surface-1 px-3 py-2 text-left transition-colors hover:border-primary-500/30 hover:bg-primary-50/50 dark:hover:bg-primary-900/10"
						onclick={() => onOpen(entry)}
					>
						<div class="min-w-0 flex-1">
							<div class="text-xs font-bold text-text-primary">{year}</div>
							<div class="truncate text-xs text-text-secondary">
								{entry.body.replace(/\n/g, ' ') || 'Kein Text'}
							</div>
						</div>
						{#if entry.mood}
							<span class="ml-2 shrink-0 text-lg">{entry.mood}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	</section>
{/if}
