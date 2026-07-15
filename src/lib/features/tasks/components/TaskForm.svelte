<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import { tasksState } from '../store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';

	let { onsubmitted }: { onsubmitted?: () => void } = $props();

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
		onsubmitted?.();
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
	<Input placeholder="Neue Aufgabe…" bind:value={title} required />
	{#if tasksState.projects.length > 0}
		<Select bind:value={projectId}>
			<option value="">Kein Projekt</option>
			{#each tasksState.projects as project (project.id)}
				<option value={project.id}>{project.name}</option>
			{/each}
		</Select>
	{/if}
	{#if activeGoals.length > 0}
		<Select bind:value={goalId}>
			<option value="">Kein Ziel</option>
			{#each activeGoals as goal (goal.id)}
				<option value={goal.id}>🎯 {goal.title}</option>
			{/each}
		</Select>
	{/if}
	<Button type="submit">
		{#snippet children()}
			Hinzufügen
		{/snippet}
	</Button>
</form>
