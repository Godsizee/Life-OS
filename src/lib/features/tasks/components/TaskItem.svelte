<script lang="ts">
	import { Trash2, Repeat, AlignLeft } from 'lucide-svelte';
	import type { Task } from '../types';
	import { tasksState } from '../store.svelte';
	import { formatRRule } from '../recurrence';
	import ListRow from '$lib/ui/ListRow.svelte';
	import CheckCircle from '$lib/ui/CheckCircle.svelte';
	import SwipeToDelete from '$lib/ui/SwipeToDelete.svelte';

	let { task, onopen, progress }: { task: Task; onopen?: (task: Task) => void; progress?: { done: number; total: number } } = $props();

	const isDone = $derived(task.status === 'done');
	const isOverdue = $derived(!isDone && !!task.due_at && new Date(task.due_at) < new Date());
	const recurrenceLabel = $derived(formatRRule(task.rrule));

	function toggle() {
		tasksState.setStatus(task.id, isDone ? 'todo' : 'done');
	}
</script>

<SwipeToDelete onDelete={() => tasksState.removeTask(task.id)} label="Aufgabe löschen">
	<ListRow>
		{#snippet leading()}
			<CheckCircle checked={isDone} ontoggle={toggle} />
		{/snippet}
		
		<div 
			class="flex flex-col flex-1 min-w-0 cursor-pointer"
			role="button"
			tabindex="0"
			onclick={() => onopen?.(task)}
			onkeydown={(e) => e.key === 'Enter' && onopen?.(task)}
		>
			<div class="flex items-center gap-1.5">
				{#if task.priority === 'high'}
					<span class="inline-block h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
				{:else if task.priority === 'low'}
					<span class="inline-block h-2 w-2 rounded-full bg-slate-400 shrink-0"></span>
				{/if}
				<p class="truncate {isDone ? 'text-text-tertiary line-through' : 'text-text-primary'}">{task.title}</p>
			</div>
			
			<div class="flex items-center gap-2 mt-0.5 flex-wrap">
				{#if task.due_at}
					<p class="text-xs shrink-0 {isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-text-secondary'}">
						{new Date(task.due_at).toLocaleDateString('de-DE')}
					</p>
				{/if}
				{#if task.description}
					<AlignLeft size={12} class="text-text-tertiary shrink-0" />
				{/if}
				{#if progress && progress.total > 0}
					<span class="inline-flex items-center rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
						{progress.done}/{progress.total}
					</span>
				{/if}
				{#if recurrenceLabel}
					<span class="inline-flex items-center gap-1 rounded bg-primary-50 dark:bg-primary-950 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:text-primary-300">
						<Repeat size={10} />
						{recurrenceLabel}
					</span>
				{/if}
				{#if task.labels && task.labels.length > 0}
					{#each task.labels.slice(0, 2) as label}
						<span class="inline-flex items-center rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary max-w-24 truncate">
							@{label}
						</span>
					{/each}
					{#if task.labels.length > 2}
						<span class="inline-flex items-center rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
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
