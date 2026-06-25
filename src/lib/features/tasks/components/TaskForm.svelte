<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { tasksState } from '../store.svelte';

	let title = $state('');
	let projectId = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim()) return;
		await tasksState.addTask({ title, project_id: projectId || null });
		title = '';
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
	<Input placeholder="Neue Aufgabe…" bind:value={title} required />
	{#if tasksState.projects.length > 0}
		<select
			bind:value={projectId}
			class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 focus:border-emerald-500 focus:outline-none"
		>
			<option value="">Kein Projekt</option>
			{#each tasksState.projects as project (project.id)}
				<option value={project.id}>{project.name}</option>
			{/each}
		</select>
	{/if}
	<Button type="submit">
		{#snippet children()}
			Hinzufügen
		{/snippet}
	</Button>
</form>
