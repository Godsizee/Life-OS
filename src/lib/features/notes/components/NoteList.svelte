<script lang="ts">
	import { Notebook } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import NoteItem from './NoteItem.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import { DURATION, motionDuration } from '$lib/ui/motion';
	import type { Note } from '../types';

	let { notes }: { notes: Note[] } = $props();
</script>

{#if notes.length === 0}
	<EmptyState icon={Notebook} title="Keine Notizen" hint="Erstelle deine erste Notiz oben." />
{:else}
	<ul class="flex flex-col gap-2">
		{#each notes as note (note.id)}
			<li class="contents" transition:fade={{ duration: motionDuration(DURATION.fast) }} animate:flip={{ duration: motionDuration(DURATION.base) }}>
				<NoteItem {note} />
			</li>
		{/each}
	</ul>
{/if}
