<script lang="ts">
	import type { Task } from '../types';
	import { tasksState } from '../store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import Field from '$lib/ui/Field.svelte';
	import CheckCircle from '$lib/ui/CheckCircle.svelte';
	import { renderMarkdownSafe } from '$lib/features/notes/markdown';
	import { labelUnion } from '../utils';

	let { task, open = $bindable(false) }: { task: Task | null; open?: boolean } = $props();

	let title = $state('');
	let description = $state('');
	let priority = $state<'low' | 'medium' | 'high'>('medium');
	let dueAt = $state('');
	let projectId = $state('');
	let goalId = $state('');
	let labels = $state<string[]>([]);
	
	let newLabel = $state('');
	let newSubtaskTitle = $state('');

	const allLabels = $derived(labelUnion(tasksState.tasks));
	const activeGoals = $derived(goalsState.goals.filter((g) => g.status !== 'done'));
	const subtasks = $derived(task ? tasksState.tasks.filter((t) => t.parent_id === task.id) : []);

	// Sync local state when task changes or sheet opens
	$effect(() => {
		if (task && open) {
			title = task.title;
			description = task.description || '';
			priority = task.priority;
			dueAt = task.due_at?.slice(0, 10) || '';
			projectId = task.project_id || '';
			goalId = task.goal_id || '';
			labels = [...(task.labels || [])];
		}
	});

	function update(patch: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_at' | 'labels' | 'project_id' | 'goal_id'>>) {
		if (task) {
			tasksState.updateTask(task.id, patch);
		}
	}

	function handleTitleBlur() {
		if (title.trim() && title !== task?.title) update({ title });
	}

	function handleDescriptionBlur() {
		if (description !== (task?.description || '')) {
			update({ description: description.trim() || null });
		}
	}

	function handlePriorityChange() {
		update({ priority });
	}

	function handleDueAtChange() {
		const parsed = dueAt ? new Date(dueAt).toISOString() : null;
		if (parsed !== task?.due_at) update({ due_at: parsed });
	}

	function handleProjectChange() {
		update({ project_id: projectId || null });
	}

	function handleGoalChange() {
		update({ goal_id: goalId || null });
	}

	function addLabel(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			const l = newLabel.trim().replace(/^@/, '');
			if (l && !labels.includes(l)) {
				labels = [...labels, l];
				update({ labels });
			}
			newLabel = '';
		}
	}

	function addSuggestedLabel(l: string) {
		if (!labels.includes(l)) {
			labels = [...labels, l];
			update({ labels });
		}
	}

	function removeLabel(l: string) {
		labels = labels.filter((x) => x !== l);
		update({ labels });
	}

	async function addSubtask(e: SubmitEvent) {
		e.preventDefault();
		if (!newSubtaskTitle.trim() || !task) return;
		await tasksState.addTask({
			title: newSubtaskTitle,
			parent_id: task.id
		});
		newSubtaskTitle = '';
	}

	function toggleSubtask(sub: Task) {
		tasksState.setStatus(sub.id, sub.status === 'done' ? 'todo' : 'done');
	}

	async function del() {
		if (task) {
			await tasksState.removeTask(task.id);
			open = false;
		}
	}
</script>

<Sheet bind:open title="Aufgabe bearbeiten">
	{#if task}
		<div class="flex flex-col gap-4">
			<Field label="Titel">
				<Input bind:value={title} onblur={handleTitleBlur} />
			</Field>

			<Field label="Beschreibung">
				<Textarea bind:value={description} surface="1" onblur={handleDescriptionBlur} />
				{#if description}
					<div class="mt-2 text-sm text-text-secondary prose prose-sm dark:prose-invert">
						{@html renderMarkdownSafe(description)}
					</div>
				{/if}
			</Field>

			<div class="grid grid-cols-2 gap-2">
				<Field label="Priorität">
					<Select bind:value={priority} onchange={handlePriorityChange}>
						<option value="low">Niedrig</option>
						<option value="medium">Mittel</option>
						<option value="high">Hoch</option>
					</Select>
				</Field>
				<Field label="Fälligkeit">
					<Input type="date" bind:value={dueAt} onchange={handleDueAtChange} />
				</Field>
			</div>

			<div class="grid grid-cols-2 gap-2">
				<Field label="Projekt">
					<Select bind:value={projectId} onchange={handleProjectChange}>
						<option value="">Kein Projekt</option>
						{#each tasksState.projects as project (project.id)}
							<option value={project.id}>{project.name}</option>
						{/each}
					</Select>
				</Field>
				<Field label="Ziel">
					<Select bind:value={goalId} onchange={handleGoalChange}>
						<option value="">Kein Ziel</option>
						{#each activeGoals as goal (goal.id)}
							<option value={goal.id}>🎯 {goal.title}</option>
						{/each}
					</Select>
				</Field>
			</div>

			<Field label="Labels">
				<Input bind:value={newLabel} onkeydown={addLabel} placeholder="Neu... (Enter/Komma)" />
				<div class="mt-2 flex flex-wrap gap-1">
					{#each labels as label}
						<Chip onclick={() => removeLabel(label)}>
							@{label} <span class="ml-1 opacity-50">×</span>
						</Chip>
					{/each}
				</div>
				{#if allLabels.filter(l => !labels.includes(l)).length > 0}
					<div class="mt-2 flex flex-wrap gap-1">
						<span class="text-xs text-text-tertiary w-full">Vorschläge:</span>
						{#each allLabels.filter(l => !labels.includes(l)) as label}
							<Chip onclick={() => addSuggestedLabel(label)}>
								<span class="opacity-70">@{label}</span>
							</Chip>
						{/each}
					</div>
				{/if}
			</Field>

			<Field label="Unteraufgaben">
				{#if subtasks.length > 0}
					<ul class="flex flex-col gap-1 mb-2">
						{#each subtasks as sub (sub.id)}
							<li class="flex items-center gap-2">
								<CheckCircle checked={sub.status === 'done'} ontoggle={() => toggleSubtask(sub)} />
								<span class="text-sm {sub.status === 'done' ? 'line-through text-text-tertiary' : 'text-text-primary'}">{sub.title}</span>
							</li>
						{/each}
					</ul>
				{/if}
				<form onsubmit={addSubtask} class="flex gap-2">
					<Input placeholder="Unteraufgabe hinzufügen..." bind:value={newSubtaskTitle} />
					<Button type="submit" variant="secondary">
						{#snippet children()}
							+
						{/snippet}
					</Button>
				</form>
			</Field>

			<div class="mt-4 border-t border-border-color pt-4 flex justify-end">
				<Button variant="ghost" onclick={del}>
					{#snippet children()}
						<span class="text-red-500">Löschen</span>
					{/snippet}
				</Button>
			</div>
		</div>
	{/if}
</Sheet>
