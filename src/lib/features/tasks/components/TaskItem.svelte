<script lang="ts">
	import { Trash2, Repeat, AlignLeft, Star } from '@lucide/svelte';
	import type { Task } from '../types';
	import { tasksState } from '../store.svelte';
	import { formatRRule } from '../recurrence';
	import { weekKey } from '#lib/features/analytics/week-window.js';
	import ListRow from '#lib/ui/ListRow.svelte';
	import CheckCircle from '#lib/ui/CheckCircle.svelte';
	import SwipeToDelete from '#lib/ui/SwipeToDelete.svelte';
	import MemberAvatar from '#lib/features/workspace/components/MemberAvatar.svelte';

	let {
		task,
		onopen,
		progress
	}: { task: Task; onopen?: (task: Task) => void; progress?: { done: number; total: number } } =
		$props();

	const isDone = $derived(task.status === 'done');
	const isOverdue = $derived(!isDone && !!task.due_at && new Date(task.due_at) < new Date());
	const isFocusWeek = $derived(task.focus_week === weekKey(new Date()));
	const recurrenceLabel = $derived(formatRRule(task.rrule));

	function toggle() {
		tasksState.setStatus(task.id, isDone ? 'todo' : 'done');
	}
</script>

<SwipeToDelete onDelete={() => tasksState.removeTaskWithUndo(task.id)} label="Aufgabe löschen">
	<ListRow>
		{#snippet leading()}
			<CheckCircle checked={isDone} ontoggle={toggle} />
		{/snippet}

		<div
			class="flex min-w-0 flex-1 cursor-pointer flex-col"
			role="button"
			tabindex="0"
			onclick={() => onopen?.(task)}
			onkeydown={(e) => e.key === 'Enter' && onopen?.(task)}
		>
			<div class="flex items-center justify-between gap-2">
				<div class="flex min-w-0 items-center gap-1.5">
					{#if isFocusWeek}
						<Star size={12} class="shrink-0 fill-amber-400 text-amber-400" />
					{/if}
					{#if task.priority === 'high'}
						<span class="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500"></span>
					{:else if task.priority === 'low'}
						<span class="inline-block h-2 w-2 shrink-0 rounded-full bg-slate-400"></span>
					{/if}
					<p class="truncate {isDone ? 'text-text-tertiary line-through' : 'text-text-primary'}">
						{task.title}
					</p>
				</div>
				{#if task.assignee_id}
					<MemberAvatar userId={task.assignee_id} size="sm" />
				{/if}
			</div>

			<div class="mt-0.5 flex flex-wrap items-center gap-2">
				{#if task.due_at}
					<p
						class="shrink-0 text-xs {isOverdue
							? 'font-medium text-red-600 dark:text-red-400'
							: 'text-text-secondary'}"
					>
						{new Date(task.due_at).toLocaleDateString('de-DE')}
					</p>
				{/if}
				{#if task.description}
					<AlignLeft size={12} class="shrink-0 text-text-tertiary" />
				{/if}
				{#if progress && progress.total > 0}
					<span
						class="inline-flex items-center rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
					>
						{progress.done}/{progress.total}
					</span>
				{/if}
				{#if recurrenceLabel}
					<span
						class="inline-flex items-center gap-1 rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300"
					>
						<Repeat size={10} />
						{recurrenceLabel}
					</span>
				{/if}
				{#if task.labels && task.labels.length > 0}
					{#each task.labels.slice(0, 2) as label}
						<span
							class="inline-flex max-w-24 items-center truncate rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
						>
							@{label}
						</span>
					{/each}
					{#if task.labels.length > 2}
						<span
							class="inline-flex items-center rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
						>
							+{task.labels.length - 2}
						</span>
					{/if}
				{/if}
			</div>
		</div>

		{#snippet trailing()}
			<button
				onclick={() => tasksState.removeTask(task.id)}
				aria-label="Löschen"
				class="shrink-0 text-text-tertiary active:text-red-600 dark:active:text-red-400"
			>
				<Trash2 size={18} />
			</button>
		{/snippet}
	</ListRow>
</SwipeToDelete>
