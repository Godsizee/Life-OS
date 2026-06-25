<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { tasksState } from '../store.svelte';

	let name = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim()) return;
		await tasksState.addProject(name);
		name = '';
	}
</script>

<form onsubmit={submit} class="flex gap-2">
	<Input placeholder="Neues Projekt…" bind:value={name} required />
	<Button type="submit">
		{#snippet children()}
			+
		{/snippet}
	</Button>
</form>
