<script lang="ts">
	import { Trash2, Repeat } from 'lucide-svelte';
	import type { Task } from '../types';
	import { tasksState } from '../store.svelte';
	import { formatRRule } from '../recurrence';

	let { task }: { task: Task } = $props();

	const isDone = $derived(task.status === 'done');
	const isOverdue = $derived(!isDone && !!task.due_at && new Date(task.due_at) < new Date());
	const recurrenceLabel = $derived(formatRRule(task.rrule));

	function toggle() {
		tasksState.setStatus(task.id, isDone ? 'todo' : 'done');
	}
</script>

<li class="flex items-center gap-3 rounded-xl border border-border-color bg-surface-0 p-3">
	<button
		onclick={toggle}
		aria-label="Status umschalten"
		class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 active:scale-95 transition-transform {isDone
			? 'border-primary-600 bg-primary-600'
			: 'border-border-color bg-surface-1'}"
	>
		{#if isDone}<span class="text-xs text-white">✓</span>{/if}
	</button>
	<div class="min-w-0 flex-1">
		<p class="truncate {isDone ? 'text-text-tertiary line-through' : 'text-text-primary'}">{task.title}</p>
		<div class="flex items-center gap-2 mt-0.5">
			{#if task.due_at}
				<p class="text-xs {isOverdue ? 'text-red-600 dark:text-red-400' : 'text-text-secondary'}">
					{new Date(task.due_at).toLocaleDateString('de-DE')}
				</p>
			{/if}
			{#if recurrenceLabel}
				<span class="inline-flex items-center gap-1 rounded bg-primary-50 dark:bg-primary-950 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:text-primary-300">
					<Repeat size={10} />
					{recurrenceLabel}
				</span>
			{/if}
		</div>
	</div>
	<button
		onclick={() => tasksState.removeTask(task.id)}
		aria-label="Löschen"
		class="shrink-0 text-text-tertiary active:text-red-600 dark:active:text-red-400"
	>
		<Trash2 size={18} />
	</button>
</li>
