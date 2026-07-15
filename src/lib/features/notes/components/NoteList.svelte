<script lang="ts">
	import { Notebook } from 'lucide-svelte';
	import NoteItem from './NoteItem.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import type { Note } from '../types';

	let { notes }: { notes: Note[] } = $props();
</script>

{#if notes.length === 0}
	<EmptyState icon={Notebook} title="Keine Notizen" hint="Erstelle deine erste Notiz oben." />
{:else}
	<ul class="flex flex-col gap-2">
		{#each notes as note (note.id)}
			<NoteItem {note} />
		{/each}
	</ul>
{/if}
