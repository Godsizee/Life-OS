<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { notesState } from '$lib/features/notes/store.svelte';
	import NoteForm from '$lib/features/notes/components/NoteForm.svelte';
	import NoteList from '$lib/features/notes/components/NoteList.svelte';
	import Input from '$lib/ui/Input.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import { Plus } from 'lucide-svelte';

	let search = $state('');
	let createOpen = $state(false);

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

<PageHeader title="Notizen">
	{#snippet trailing()}
		<button
			onclick={() => (createOpen = true)}
			aria-label="Neue Notiz"
			class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white active:scale-95 transition-transform"
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

<section class="mb-4">
	<Input placeholder="Notizen durchsuchen…" bind:value={search} />
</section>

<section>
	<NoteList notes={filtered} />
</section>
