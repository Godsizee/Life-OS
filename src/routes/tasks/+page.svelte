<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import TaskForm from '$lib/features/tasks/components/TaskForm.svelte';
	import TaskList from '$lib/features/tasks/components/TaskList.svelte';
	import ProjectForm from '$lib/features/tasks/components/ProjectForm.svelte';

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

<header class="mb-6">
	<h1 class="text-2xl font-bold tracking-tight">Aufgaben</h1>
</header>

<section class="mb-4">
	<TaskForm />
</section>

{#if tasksState.projects.length > 0}
	<section class="mb-4 flex flex-wrap gap-2">
		<button
			onclick={() => (selectedProject = null)}
			class="rounded-full px-3 py-1 text-xs font-medium {selectedProject === null
				? 'bg-primary-600 text-white'
				: 'bg-surface-2 text-text-secondary border border-border-color/30'}"
		>
			Alle
		</button>
		{#each tasksState.projects as project (project.id)}
			<button
				onclick={() => (selectedProject = project.id)}
				class="rounded-full px-3 py-1 text-xs font-medium {selectedProject === project.id
					? 'bg-primary-600 text-white'
					: 'bg-surface-2 text-text-secondary border border-border-color/30'}"
			>
				{project.name}
			</button>
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
