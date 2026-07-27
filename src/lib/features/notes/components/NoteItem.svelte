<script lang="ts">
	import { Hash, ImageIcon, ListChecks, Lock, Pin, Trash2 } from 'lucide-svelte';
	import type { Note } from '../types';
	import { notesState } from '../store.svelte';
	import { checklistProgress, plainTextPreview } from '../markdown';
	import { attachmentsState } from '$lib/features/attachments/store.svelte';
	import SwipeToDelete from '$lib/ui/SwipeToDelete.svelte';

	let { note, onopen }: { note: Note; onopen: (note: Note) => void } = $props();

	const preview = $derived(plainTextPreview(note.body ?? '', 120));
	const progress = $derived(checklistProgress(note.body ?? ''));
	const attachmentCount = $derived(attachmentsState.countFor('note', note.id));
</script>

<SwipeToDelete onDelete={() => notesState.removeNote(note.id)} label="Notiz löschen">
	<div class="interactive-card flex h-full flex-col gap-2 rounded-2xl border border-border-color bg-surface-0 p-4">
		<div class="flex items-start gap-2">
			<button type="button" onclick={() => onopen(note)} class="min-w-0 flex-1 text-left">
				<span class="flex items-center gap-1.5">
					{#if note.private}
						<Lock size={14} class="shrink-0 text-text-tertiary" aria-label="Privat" />
					{/if}
					<span class="truncate font-semibold text-text-primary">{note.title}</span>
				</span>
			</button>

			<div class="flex shrink-0 gap-1">
				<button
					type="button"
					onclick={() => notesState.togglePin(note.id)}
					aria-label={note.pinned ? 'Losl\u00f6sen' : 'Anpinnen'}
					class="flex h-9 w-9 items-center justify-center rounded-lg {note.pinned
						? 'text-accent-600 dark:text-accent-400'
						: 'text-text-tertiary'}"
				>
					<Pin size={16} />
				</button>
				<button
					type="button"
					onclick={() => notesState.removeNote(note.id)}
					aria-label="Löschen"
					class="flex h-9 w-9 items-center justify-center rounded-lg text-text-tertiary active:text-red-600 dark:active:text-red-400"
				>
					<Trash2 size={16} />
				</button>
			</div>
		</div>

		<button type="button" onclick={() => onopen(note)} class="min-w-0 flex-1 text-left">
			{#if preview}
				<p class="line-clamp-3 text-sm text-text-secondary">{preview}</p>
			{:else}
				<p class="text-sm text-text-tertiary">Leere Notiz — zum Schreiben tippen</p>
			{/if}
		</button>

		{#if progress.total > 0 || attachmentCount > 0 || note.tags.length > 0}
			<div class="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
				{#if progress.total > 0}
					<span class="flex items-center gap-1 font-bold">
						<ListChecks size={13} />{progress.done}/{progress.total}
					</span>
				{/if}
				{#if attachmentCount > 0}
					<span class="flex items-center gap-1 font-bold">
						<ImageIcon size={13} />{attachmentCount}
					</span>
				{/if}
				{#each note.tags.slice(0, 3) as tag (tag)}
					<span class="flex items-center gap-0.5 rounded-full bg-surface-2 px-2 py-0.5">
						<Hash size={11} />{tag}
					</span>
				{/each}
			</div>
		{/if}
	</div>
</SwipeToDelete>
