<script lang="ts">
	import { formatShortDate } from '$lib/core/date';
	import type { JournalEntry, JournalKind } from '../types';
	import DayContextStrip from './DayContextStrip.svelte';
	import AttachmentSection from '$lib/features/attachments/components/AttachmentSection.svelte';

	import { journalSnippet } from '../journal-filter';

	let {
		entries,
		onEdit,
		query = ''
	}: {
		entries: JournalEntry[];
		onEdit: (date: string, kind: JournalKind) => void;
		query?: string;
	} = $props();

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
		{@const snippet = query.trim() ? journalSnippet(entry.body, query.trim()) : null}
		<li
			class="rounded-xl border border-border-color bg-surface-0 p-3 {entry.kind === 'weekly'
				? 'border-primary-500/30 bg-primary-50/20 dark:bg-primary-950/10'
				: ''}"
		>
			<div class="flex items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					{#if entry.mood}<span class="text-lg">{moodEmoji[entry.mood] ?? ''}</span>{/if}
					<p class="text-sm font-bold text-text-primary">
						{#if entry.kind === 'weekly'}
							Wochenabschluss {formatShortDate(entry.date)}
						{:else}
							{new Date(entry.date).toLocaleDateString('de-DE', {
								weekday: 'short',
								day: '2-digit',
								month: '2-digit'
							})}
						{/if}
					</p>
				</div>
				<button
					onclick={() => onEdit(entry.date, entry.kind)}
					class="text-xs font-bold text-primary-600 transition-colors hover:underline dark:text-primary-400"
				>
					Bearbeiten
				</button>
			</div>

			{#if snippet}
				<div class="mt-1.5 rounded-lg bg-surface-2 p-2 text-xs text-text-primary border border-border-color/30">
					<span class="font-bold text-text-tertiary">Treffer:</span> {snippet}
				</div>
			{/if}

			{#if entry.body}
				<p class="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{entry.body}</p>
			{/if}

			<div class="mt-2">
				<AttachmentSection entityType="journal" entityId={entry.id} readonly={true} />
			</div>

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
