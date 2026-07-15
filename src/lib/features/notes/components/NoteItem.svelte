<script lang="ts">
	import { Pin, Trash2 } from 'lucide-svelte';
	import type { Note } from '../types';
	import { notesState } from '../store.svelte';
	import { renderMarkdownSafe } from '../markdown';
	import ListRow from '$lib/ui/ListRow.svelte';
	import SwipeToDelete from '$lib/ui/SwipeToDelete.svelte';

	let { note }: { note: Note } = $props();

	let editing = $state(false);
	let body = $state(note.body);

	function saveBody() {
		editing = false;
		if (body !== note.body) notesState.updateNote(note.id, { body });
	}
</script>

<SwipeToDelete onDelete={() => notesState.removeNote(note.id)} label="Notiz löschen">
	<ListRow align="start">
		<p class="min-w-0 flex-1 truncate font-medium text-text-primary">{note.title}</p>
		{#if editing}
			<textarea
				bind:value={body}
				onblur={saveBody}
				rows={3}
				class="mt-2 w-full rounded-lg border border-border-color bg-surface-1 p-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none transition-colors duration-200"
			></textarea>
		{:else}
			<button type="button" onclick={() => (editing = true)} class="mt-1 block w-full text-left">
				{#if note.body}
					<p class="line-clamp-2 text-sm text-text-secondary">{@html renderMarkdownSafe(note.body)}</p>
				{:else}
					<p class="line-clamp-2 text-sm text-text-tertiary">Notiz hinzufügen…</p>
				{/if}
			</button>
		{/if}
		{#snippet trailing()}
			<div class="flex shrink-0 gap-2">
				<button
					onclick={() => notesState.togglePin(note.id)}
					aria-label="Anpinnen"
					class={note.pinned ? 'text-accent-600 dark:text-accent-400' : 'text-text-tertiary'}
				>
					<Pin size={18} />
				</button>
				<button
					onclick={() => notesState.removeNote(note.id)}
					aria-label="Löschen"
					class="text-text-tertiary active:text-red-600 dark:active:text-red-400"
				>
					<Trash2 size={18} />
				</button>
			</div>
		{/snippet}
	</ListRow>
</SwipeToDelete>
