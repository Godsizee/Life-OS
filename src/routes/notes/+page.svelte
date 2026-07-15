<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { notesState } from '$lib/features/notes/store.svelte';
	import NoteForm from '$lib/features/notes/components/NoteForm.svelte';
	import NoteList from '$lib/features/notes/components/NoteList.svelte';
	import Input from '$lib/ui/Input.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';

	let search = $state('');

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) notesState.load(id);
	});
	onDestroy(() => notesState.unload());

	const filtered = $derived(
		(() => {
			const query = search.trim().toLowerCase();
			if (!query) return notesState.notes;
			return notesState.notes.filter(
				(n) =>
					n.title.toLowerCase().includes(query) ||
					n.body.toLowerCase().includes(query) ||
					n.tags.some((tag) => tag.toLowerCase().includes(query))
			);
		})()
	);
</script>

<svelte:head>
	<title>Notizen - Life OS</title>
</svelte:head>

<PageHeader title="Notizen" />

<section class="mb-4">
	<NoteForm />
</section>

<section class="mb-4">
	<Input placeholder="Notizen durchsuchen…" bind:value={search} />
</section>

<section>
	<NoteList notes={filtered} />
</section>
