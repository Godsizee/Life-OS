<script lang="ts">
	import { Pin, Trash2 } from 'lucide-svelte';
	import type { Note } from '../types';
	import { notesState } from '../store.svelte';
	import { renderMarkdownSafe } from '../markdown';

	let { note }: { note: Note } = $props();

	let editing = $state(false);
	let body = $state(note.body);

	function saveBody() {
		editing = false;
		if (body !== note.body) notesState.updateNote(note.id, { body });
	}
</script>

<li class="rounded-xl border border-border-color bg-surface-0 p-3">
	<div class="flex items-start justify-between gap-2">
		<p class="min-w-0 flex-1 truncate font-medium text-text-primary">{note.title}</p>
		<div class="flex shrink-0 gap-2">
			<button
				onclick={() => notesState.togglePin(note.id)}
				aria-label="Anpinnen"
				class={note.pinned ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-tertiary'}
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
	</div>
	{#if editing}
		<textarea
			bind:value={body}
			onblur={saveBody}
			rows={3}
			class="mt-2 w-full rounded-lg border border-border-color bg-surface-1 p-2 text-sm text-text-primary focus:border-emerald-500 focus:outline-none transition-colors duration-200"
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
</li>
