<script lang="ts">
	import type { Task } from '../types';
	import { tasksState } from '../store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { timeTrackingState } from '$lib/features/timetracking/store.svelte';
	import { formatMinutes } from '$lib/features/timetracking/stats';
	import TimeEntryForm from '$lib/features/timetracking/components/TimeEntryForm.svelte';
	import TimeEntryList from '$lib/features/timetracking/components/TimeEntryList.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import Field from '$lib/ui/Field.svelte';
	import CheckCircle from '$lib/ui/CheckCircle.svelte';
	import { renderMarkdownSafe, toggleChecklistLine } from '$lib/features/notes/markdown';
	import { labelUnion } from '../utils';
	import ReminderSection from '$lib/features/reminders/components/ReminderSection.svelte';
	import MemberSelect from '$lib/features/workspace/components/MemberSelect.svelte';
	import RecurrenceField from './RecurrenceField.svelte';

	let { task = $bindable(), open = $bindable(false) }: { task: Task | null; open?: boolean } = $props();

	let title = $state('');
	let description = $state('');
	let priority = $state<'low' | 'medium' | 'high'>('medium');
	let dueAt = $state('');
	let projectId = $state('');
	let goalId = $state('');
	let labels = $state<string[]>([]);
	let assigneeId = $state<string | null>(null);
	let rrule = $state<string | null>(null);
	
	let newLabel = $state('');
	let newSubtaskTitle = $state('');

	let addTimeOpen = $state(false);
	const timeEntries = $derived(task ? timeTrackingState.entriesForTask(task.id) : []);
	const timeTotal = $derived(task ? timeTrackingState.totalForTask(task.id) : 0);

	/** Checkbox in der Beschreibungs-Vorschau kippen (Muster: NoteDetailSheet). */
	function onDescriptionPreviewChange(event: Event) {
		const target = event.target as HTMLElement | null;
		if (!task || !target || target.tagName !== 'INPUT') return;
		const raw = target.getAttribute('data-md-line');
		if (raw === null) return;
		const next = toggleChecklistLine(description, Number(raw));
		if (next === description) return;
		description = next;
		update({ description: next });
	}

	// Sheet schließt -> Nachtrag-Formular wieder einklappen.
	$effect(() => {
		if (!open) addTimeOpen = false;
	});

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
			assigneeId = task.assignee_id || null;
			rrule = task.rrule || null;
		}
	});

	function update(patch: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'due_at' | 'labels' | 'project_id' | 'goal_id' | 'rrule'>>) {
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

	function handleAssigneeChange(next: string | null) {
		if (task && next !== task.assignee_id) tasksState.setAssignee(task.id, next);
	}

	function handleRruleChange(next: string | null) {
		if (next !== task?.rrule) update({ rrule: next });
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

			<Field label="Notizen & Checklisten">
				<Textarea
					bind:value={description}
					onblur={handleDescriptionBlur}
					placeholder="Details zur Aufgabe..."
					rows={4}
				/>
				{#if description}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="markdown-body mt-2" onchange={onDescriptionPreviewChange}>
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
				<Field label="Zugewiesen an">
					<MemberSelect value={assigneeId} onchange={handleAssigneeChange} />
				</Field>
			</div>

			<div class="grid grid-cols-2 gap-2">
				<Field label="Fälligkeit">
					<Input type="date" bind:value={dueAt} onchange={handleDueAtChange} />
				</Field>
				<Field label="Wiederholung">
					<RecurrenceField value={rrule} onchange={handleRruleChange} />
					{#if rrule && !dueAt}
						<div class="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
							Wiederholung braucht ein Fälligkeitsdatum.
						</div>
					{/if}
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
					{#each labels as label (label)}
						<Chip onclick={() => removeLabel(label)}>
							@{label} <span class="ml-1 opacity-50">×</span>
						</Chip>
					{/each}
				</div>
				{#if allLabels.filter(l => !labels.includes(l)).length > 0}
					<div class="mt-2 flex flex-wrap gap-1">
						<span class="text-xs text-text-tertiary w-full">Vorschläge:</span>
						{#each allLabels.filter(l => !labels.includes(l)) as label (label)}
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

			<Field label="Zeit">
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm text-text-secondary">
						{timeTotal > 0 ? formatMinutes(timeTotal) : 'Noch keine Zeit erfasst'}
					</span>
					<button
						onclick={() => (addTimeOpen = !addTimeOpen)}
						class="min-h-9 rounded-lg px-2 text-xs font-medium text-primary-600 hover:bg-surface-2 dark:text-primary-400"
					>
						{addTimeOpen ? 'Abbrechen' : '+ Zeit nachtragen'}
					</button>
				</div>

				{#if addTimeOpen}
					<div class="mt-3 rounded-xl border border-border-color bg-surface-1 p-3">
						<TimeEntryForm taskId={task.id} onsaved={() => (addTimeOpen = false)} />
					</div>
				{/if}

				{#if timeEntries.length > 0}
					<div class="mt-2">
						<TimeEntryList entries={timeEntries} />
					</div>
				{/if}
			</Field>

			<div class="border-t border-border-color pt-4">
				<ReminderSection
					entityType="task"
					entityId={task.id}
					title={task.title}
					url="/tasks"
					mode="datetime"
					defaultDate={task.due_at?.slice(0, 10) ?? null}
					defaultTime="09:00"
				/>
			</div>

			<div class="mt-4 border-t border-border-color pt-4 flex items-center justify-between">
				<div class="flex items-center gap-1">
					<Button variant="ghost" onclick={() => tasksState.move(task!.id, -1)}>
						{#snippet children()}
							▲<span class="sr-only">Nach oben</span>
						{/snippet}
					</Button>
					<Button variant="ghost" onclick={() => tasksState.move(task!.id, 1)}>
						{#snippet children()}
							▼<span class="sr-only">Nach unten</span>
						{/snippet}
					</Button>
				</div>
				<Button variant="ghost" onclick={del}>
					{#snippet children()}
						<span class="text-red-500">Löschen</span>
					{/snippet}
				</Button>
			</div>
		</div>
	{/if}
</Sheet>
