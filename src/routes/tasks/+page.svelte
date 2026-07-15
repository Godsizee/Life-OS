<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import TaskForm from '$lib/features/tasks/components/TaskForm.svelte';
	import TaskList from '$lib/features/tasks/components/TaskList.svelte';
	import ProjectForm from '$lib/features/tasks/components/ProjectForm.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Chip from '$lib/ui/Chip.svelte';

	let selectedProject = $state<string | null>(null);

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) tasksState.load(id);
	});
	onDestroy(() => tasksState.unload());

	const filtered = $derived(
		selectedProject
			? tasksState.tasks.filter((t) => t.project_id === selectedProject)
			: tasksState.tasks
	);
	const openTasks = $derived(filtered.filter((t) => t.status !== 'done'));
	const doneTasks = $derived(filtered.filter((t) => t.status === 'done'));
</script>

<svelte:head>
	<title>Aufgaben - Life OS</title>
</svelte:head>

<PageHeader title="Aufgaben" />

<section class="mb-4">
	<TaskForm />
</section>

{#if tasksState.projects.length > 0}
	<section class="mb-4 flex flex-wrap gap-2">
		<Chip selected={selectedProject === null} onclick={() => (selectedProject = null)}>Alle</Chip>
		{#each tasksState.projects as project (project.id)}
			<Chip selected={selectedProject === project.id} onclick={() => (selectedProject = project.id)}>
				{project.name}
			</Chip>
		{/each}
	</section>
{/if}

<section class="flex flex-col gap-6">
	<TaskList tasks={openTasks} />
	{#if doneTasks.length > 0}
		<details>
			<summary class="cursor-pointer text-sm text-text-secondary font-medium">Erledigt ({doneTasks.length})</summary>
			<div class="mt-2">
				<TaskList tasks={doneTasks} />
			</div>
		</details>
	{/if}
	<details>
		<summary class="cursor-pointer text-sm text-text-secondary font-medium">Projekt anlegen</summary>
		<div class="mt-2">
			<ProjectForm />
		</div>
	</details>
</section>
