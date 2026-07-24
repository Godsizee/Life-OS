<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import type { Task } from '$lib/features/tasks/types';
	import TaskForm from '$lib/features/tasks/components/TaskForm.svelte';
	import TaskList from '$lib/features/tasks/components/TaskList.svelte';
	import TaskBoard from '$lib/features/tasks/components/TaskBoard.svelte';
	import TaskDetailSheet from '$lib/features/tasks/components/TaskDetailSheet.svelte';
	import ProjectForm from '$lib/features/tasks/components/ProjectForm.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { Plus, FolderPlus, Kanban, List } from 'lucide-svelte';
	import { smartViewFilter, labelUnion, type SmartView } from '$lib/features/tasks/utils';

	let selectedProject = $state<string | null>(null);
	let createOpen = $state(false);
	let projectSheetOpen = $state(false);
	
	let smartView = $state<SmartView>('all');
	let selectedLabels = $state<string[]>([]);
	let detailTask = $state<Task | null>(null);
	let detailOpen = $state(false);
	let view = $state<'list' | 'board'>('list');

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) tasksState.load(id);
	});
	onDestroy(() => tasksState.unload());

	const allLabels = $derived(labelUnion(tasksState.tasks));
	
	const filtered = $derived.by(() => {
		let r = tasksState.tasks;
		if (selectedProject) r = r.filter((t) => t.project_id === selectedProject);
		if (selectedLabels.length) r = r.filter((t) => selectedLabels.every((l) => t.labels?.includes(l)));
		r = smartViewFilter(r, smartView);
		return r;
	});
	
	const openTasks = $derived(filtered.filter((t) => t.status !== 'done'));
	const doneTasks = $derived(filtered.filter((t) => t.status === 'done'));
	
	function openDetail(t: Task) {
		detailTask = t;
		detailOpen = true;
	}
	
	function toggleLabel(l: string) {
		if (selectedLabels.includes(l)) {
			selectedLabels = selectedLabels.filter(x => x !== l);
		} else {
			selectedLabels = [...selectedLabels, l];
		}
	}
</script>

<svelte:head>
	<title>Aufgaben - Life OS</title>
</svelte:head>

<PageHeader title="Aufgaben">
	{#snippet trailing()}
		<div class="hidden lg:flex items-center bg-surface-1 rounded-xl p-1 mr-2">
			<button 
				class="p-2 rounded-lg {view === 'list' ? 'bg-surface-0 shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}"
				onclick={() => view = 'list'}
				aria-label="Listenansicht"
			>
				<List size={20} />
			</button>
			<button 
				class="p-2 rounded-lg {view === 'board' ? 'bg-surface-0 shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}"
				onclick={() => view = 'board'}
				aria-label="Boardansicht"
			>
				<Kanban size={20} />
			</button>
		</div>
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
	<div class="p-4">
		<TaskForm onsubmitted={() => (createOpen = false)} />
	</div>
</Sheet>

<Sheet bind:open={projectSheetOpen} title="Neues Projekt">
	<div class="p-4">
		<ProjectForm onsubmitted={() => (projectSheetOpen = false)} />
	</div>
</Sheet>

<TaskDetailSheet bind:open={detailOpen} task={detailTask} />

<div class="mb-4 flex flex-col gap-3">
	<!-- Smart Views -->
	<section class="flex flex-wrap gap-2">
		<Chip selected={smartView === 'all'} onclick={() => (smartView = 'all')}>Alle</Chip>
		<Chip selected={smartView === 'today'} onclick={() => (smartView = 'today')}>Heute</Chip>
		<Chip selected={smartView === 'upcoming'} onclick={() => (smartView = 'upcoming')}>Demnächst</Chip>
		<Chip selected={smartView === 'no_date'} onclick={() => (smartView = 'no_date')}>Ohne Datum</Chip>
	</section>

	<!-- Projekte -->
	{#if tasksState.projects.length > 0}
		<section class="flex flex-wrap gap-2">
			{#each tasksState.projects as project (project.id)}
				<Chip selected={selectedProject === project.id} onclick={() => (selectedProject = selectedProject === project.id ? null : project.id)}>
					{project.name}
				</Chip>
			{/each}
		</section>
	{/if}

	<!-- Labels -->
	{#if allLabels.length > 0}
		<section class="flex flex-wrap gap-2">
			{#each allLabels as label}
				<Chip selected={selectedLabels.includes(label)} onclick={() => toggleLabel(label)}>
					@{label}
				</Chip>
			{/each}
		</section>
	{/if}
</div>

<section class="flex flex-col gap-6">
	{#if tasksState.loading}
		<div class="flex flex-col gap-2">
			<Skeleton height="3.5rem" />
			<Skeleton height="3.5rem" />
			<Skeleton height="3.5rem" />
		</div>
	{:else}
		{#if view === 'board'}
			<div class="hidden lg:block">
				<TaskBoard tasks={filtered} onopen={openDetail} />
			</div>
			<div class="lg:hidden">
				<TaskList tasks={openTasks} onopen={openDetail} />
				{#if doneTasks.length > 0}
					<details class="mt-4">
						<summary class="cursor-pointer text-sm text-text-secondary font-medium">Erledigt ({doneTasks.length})</summary>
						<div class="mt-2">
							<TaskList tasks={doneTasks} onopen={openDetail} />
						</div>
					</details>
				{/if}
			</div>
		{:else}
			<div>
				<TaskList tasks={openTasks} onopen={openDetail} />
				{#if doneTasks.length > 0}
					<details class="mt-4">
						<summary class="cursor-pointer text-sm text-text-secondary font-medium">Erledigt ({doneTasks.length})</summary>
						<div class="mt-2">
							<TaskList tasks={doneTasks} onopen={openDetail} />
						</div>
					</details>
				{/if}
			</div>
		{/if}
	{/if}
	
	<button
		onclick={() => (projectSheetOpen = true)}
		class="flex min-h-12 items-center gap-2 self-start text-sm font-medium text-text-secondary hover:text-text-primary"
	>
		<FolderPlus size={16} />
		Projekt anlegen
	</button>
</section>
