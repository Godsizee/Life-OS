<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { notesState } from '../store.svelte';

	let { onsubmitted }: { onsubmitted?: () => void } = $props();

	let title = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim()) return;
		await notesState.addNote({ title });
		title = '';
		onsubmitted?.();
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
	<Input placeholder="Neue Notiz…" bind:value={title} required />
	<Button type="submit">
		{#snippet children()}
			Hinzufügen
		{/snippet}
	</Button>
</form>
