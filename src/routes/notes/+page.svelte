<script lang="ts">
	import { page } from '$app/state';
	import { Hash, Plus } from 'lucide-svelte';
	import { notesState } from '$lib/features/notes/store.svelte';
	import { searchNotes, sortNotes, tagUnion, type NoteSort, NOTE_SORT_LABELS } from '$lib/features/notes/filter';
	import type { Note } from '$lib/features/notes/types';
	import { onMount } from 'svelte';
	import NoteForm from '$lib/features/notes/components/NoteForm.svelte';
	import NoteList from '$lib/features/notes/components/NoteList.svelte';
	import NoteDetailSheet from '$lib/features/notes/components/NoteDetailSheet.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import Input from '$lib/ui/Input.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';

	let search = $state('');
	let activeTag = $state<string | null>(null);
	let createOpen = $state(false);
	let detailOpen = $state(false);
	let detailNote = $state<Note | null>(null);
	let sortMode = $state<NoteSort>('updated');

	onMount(() => {
		const saved = localStorage.getItem('lifeos:notes-sort');
		if (saved && ['updated', 'created', 'title'].includes(saved)) {
			sortMode = saved as NoteSort;
		}
	});

	function setSort(s: NoteSort) {
		sortMode = s;
		localStorage.setItem('lifeos:notes-sort', s);
	}

	// Laden/Entladen liegt zentral in core/workspace-data.ts (+layout.svelte).

	// Tiefer Link aus der Command-Palette: /notes?note=<id> oeffnet direkt das Sheet.
	$effect(() => {
		const wanted = page.url.searchParams.get('note');
		if (!wanted || detailOpen) return;
		const found = notesState.notes.find((n) => n.id === wanted);
		if (found) open(found);
	});

	const tags = $derived(tagUnion(notesState.notes));
	const visibleMatches = $derived(searchNotes(sortNotes(notesState.notes, sortMode), search, activeTag));
	const pinnedMatches = $derived(visibleMatches.filter((m) => m.note.pinned));
	const restMatches = $derived(visibleMatches.filter((m) => !m.note.pinned));

	function open(note: Note) {
		detailNote = note;
		detailOpen = true;
	}

	// Nach einem Update aus dem Store nachziehen, damit das Sheet frische Daten zeigt.
	const liveNote = $derived(
		detailNote ? (notesState.notes.find((n) => n.id === detailNote!.id) ?? null) : null
	);
</script>

<svelte:head>
	<title>Notizen - Life OS</title>
</svelte:head>

<PageHeader title="Notizen">
	{#snippet trailing()}
		<button
			onclick={() => (createOpen = true)}
			aria-label="Neue Notiz"
			class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white transition-transform active:scale-95"
		>
			<Plus size={22} />
		</button>
	{/snippet}
</PageHeader>

<Sheet bind:open={createOpen} title="Neue Notiz">
	{#snippet children()}
		<div class="p-4">
			<NoteForm onsubmitted={() => (createOpen = false)} />
		</div>
	{/snippet}
</Sheet>

<NoteDetailSheet note={liveNote} bind:open={detailOpen} />

<section class="mb-3">
	<Input placeholder="Notizen durchsuchen…" bind:value={search} />
</section>

{#if tags.length > 0}
	<section class="mb-4 flex gap-2 overflow-x-auto pb-1">
		<Chip selected={activeTag === null} onclick={() => (activeTag = null)}>Alle</Chip>
		{#each tags as tag (tag)}
			<Chip selected={activeTag === tag} onclick={() => (activeTag = activeTag === tag ? null : tag)}>
				<Hash size={12} />{tag}
			</Chip>
		{/each}
	</section>
{/if}

<div class="mb-4 flex items-center gap-2 text-sm text-text-secondary">
	<span>Sortieren:</span>
	<button class="hover:text-text-primary {sortMode === 'updated' ? 'font-bold text-text-primary' : ''}" onclick={() => setSort('updated')}>{NOTE_SORT_LABELS.updated}</button>
	<span>·</span>
	<button class="hover:text-text-primary {sortMode === 'created' ? 'font-bold text-text-primary' : ''}" onclick={() => setSort('created')}>{NOTE_SORT_LABELS.created}</button>
	<span>·</span>
	<button class="hover:text-text-primary {sortMode === 'title' ? 'font-bold text-text-primary' : ''}" onclick={() => setSort('title')}>{NOTE_SORT_LABELS.title}</button>
</div>

<section class="flex flex-col gap-6">
	{#if notesState.loading}
		<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
			<Skeleton height="7rem" />
			<Skeleton height="7rem" />
			<Skeleton height="7rem" />
		</div>
	{:else}
		{#if pinnedMatches.length > 0}
			<div class="flex flex-col gap-2">
				<h2 class="text-xs font-bold uppercase tracking-wide text-text-tertiary">Angepinnt</h2>
				<NoteList matches={pinnedMatches} onopen={open} />
			</div>
		{/if}

		<div class="flex flex-col gap-2">
			{#if pinnedMatches.length > 0 && restMatches.length > 0}
				<h2 class="text-xs font-bold uppercase tracking-wide text-text-tertiary">Weitere</h2>
			{/if}
			<NoteList
				matches={restMatches}
				onopen={open}
				emptyHint={search || activeTag
					? 'Keine Treffer — Suche oder Tag-Filter zurücksetzen.'
					: 'Erstelle deine erste Notiz über das Plus oben rechts.'}
			/>
		</div>
	{/if}
</section>
