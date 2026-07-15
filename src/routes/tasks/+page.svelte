<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import TaskForm from '$lib/features/tasks/components/TaskForm.svelte';
	import TaskList from '$lib/features/tasks/components/TaskList.svelte';
	import ProjectForm from '$lib/features/tasks/components/ProjectForm.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import { Plus, FolderPlus } from 'lucide-svelte';

	let selectedProject = $state<string | null>(null);
	let createOpen = $state(false);
	let projectSheetOpen = $state(false);

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

<PageHeader title="Aufgaben">
	{#snippet trailing()}
		<button
			onclick={() => (createOpen = true)}
			aria-label="Neue Aufgabe"
			class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white active:scale-95 transition-transform"
		>
			<Plus size={22} />
		</button>
	{/snippet}
</PageHeader>

<Sheet bind:open={createOpen} title="Neue Aufgabe">
	{#snippet children()}
		<div class="p-4">
			<TaskForm onsubmitted={() => (createOpen = false)} />
		</div>
	{/snippet}
</Sheet>

<Sheet bind:open={projectSheetOpen} title="Neues Projekt">
	{#snippet children()}
		<div class="p-4">
			<ProjectForm onsubmitted={() => (projectSheetOpen = false)} />
		</div>
	{/snippet}
</Sheet>

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
	<button
		onclick={() => (projectSheetOpen = true)}
		class="flex min-h-12 items-center gap-2 self-start text-sm font-medium text-text-secondary hover:text-text-primary"
	>
		<FolderPlus size={16} />
		Projekt anlegen
	</button>
</section>
