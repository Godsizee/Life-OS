<script lang="ts">
	import NoteItem from './NoteItem.svelte';
	import type { Note } from '../types';

	let { notes }: { notes: Note[] } = $props();
</script>

<ul class="flex flex-col gap-2">
	{#each notes as note (note.id)}
		<NoteItem {note} />
	{:else}
		<p class="text-sm text-slate-500">Keine Notizen.</p>
	{/each}
</ul>
