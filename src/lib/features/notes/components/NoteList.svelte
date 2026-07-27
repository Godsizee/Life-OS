<script lang="ts">
	import { Notebook } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import NoteItem from './NoteItem.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import { DURATION, motionDuration } from '$lib/ui/motion';
	import type { Note } from '../types';

	let {
		notes,
		onopen,
		emptyHint = 'Erstelle deine erste Notiz oben.'
	}: {
		notes: Note[];
		onopen: (note: Note) => void;
		emptyHint?: string;
	} = $props();
</script>

{#if notes.length === 0}
	<EmptyState icon={Notebook} title="Keine Notizen" hint={emptyHint} />
{:else}
	<ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
		{#each notes as note (note.id)}
			<li
				transition:fade={{ duration: motionDuration(DURATION.fast) }}
				animate:flip={{ duration: motionDuration(DURATION.base) }}
			>
				<NoteItem {note} {onopen} />
			</li>
		{/each}
	</ul>
{/if}
