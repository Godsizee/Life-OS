<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import { tasksState } from '../store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { parseTaskInput } from '../quick-add';
	import Chip from '$lib/ui/Chip.svelte';

	let { onsubmitted }: { onsubmitted?: () => void } = $props();

	let title = $state('');
	let projectId = $state('');
	let goalId = $state('');

	const activeGoals = $derived(goalsState.goals.filter((g) => g.status !== 'done'));
	const parsed = $derived(parseTaskInput(title));

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim()) return;
		
		const p = parseTaskInput(title);
		const project = p.project_name
			? tasksState.projects.find((pr) => pr.name.toLowerCase() === p.project_name!.toLowerCase())
			: null;
		
		await tasksState.addTask({
			title: p.title,
			priority: p.priority,
			due_at: p.due_at,
			labels: p.labels,
			rrule: p.rrule,
			project_id: project?.id ?? (projectId || null),
			goal_id: goalId || null
		});
		title = '';
		goalId = '';
		onsubmitted?.();
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
	<Input placeholder="Neue Aufgabe…" bind:value={title} required />
	{#if title.trim()}
		<div class="flex flex-wrap gap-1 mt-1">
			{#if parsed.priority === 'high'}
				<Chip><span class="text-red-500 font-bold">Wichtig</span></Chip>
			{/if}
			{#if parsed.priority === 'low'}
				<Chip><span class="text-slate-400">Später</span></Chip>
			{/if}
			{#if parsed.due_at}
				<Chip>{new Date(parsed.due_at).toLocaleDateString('de-DE')}</Chip>
			{/if}
			{#if parsed.rrule}
				<Chip>Wiederholend</Chip>
			{/if}
			{#if parsed.project_name}
				<Chip>#{parsed.project_name}</Chip>
			{/if}
			{#each parsed.labels as label}
				<Chip>@{label}</Chip>
			{/each}
		</div>
	{/if}
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
