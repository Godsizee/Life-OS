<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { tasksState } from '../store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';

	let title = $state('');
	let projectId = $state('');
	let goalId = $state('');

	const activeGoals = $derived(goalsState.goals.filter((g) => g.status !== 'done'));

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim()) return;
		await tasksState.addTask({
			title,
			project_id: projectId || null,
			goal_id: goalId || null
		});
		title = '';
		goalId = '';
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
	<Input placeholder="Neue Aufgabe…" bind:value={title} required />
	{#if tasksState.projects.length > 0}
		<select
			bind:value={projectId}
			class="min-h-12 rounded-xl border border-border-color bg-surface-0 px-4 text-text-primary focus:border-emerald-500 focus:outline-none transition-colors duration-200"
		>
			<option value="">Kein Projekt</option>
			{#each tasksState.projects as project (project.id)}
				<option value={project.id}>{project.name}</option>
			{/each}
		</select>
	{/if}
	{#if activeGoals.length > 0}
		<select
			bind:value={goalId}
			class="min-h-12 rounded-xl border border-border-color bg-surface-0 px-4 text-text-primary focus:border-emerald-500 focus:outline-none transition-colors duration-200"
		>
			<option value="">Kein Ziel</option>
			{#each activeGoals as goal (goal.id)}
				<option value={goal.id}>🎯 {goal.title}</option>
			{/each}
		</select>
	{/if}
	<Button type="submit">
		{#snippet children()}
			Hinzufügen
		{/snippet}
	</Button>
</form>
