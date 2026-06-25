<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { Task } from '../types';
	import { tasksState } from '../store.svelte';

	let { task }: { task: Task } = $props();

	const isDone = $derived(task.status === 'done');
	const isOverdue = $derived(!isDone && !!task.due_at && new Date(task.due_at) < new Date());

	function toggle() {
		tasksState.setStatus(task.id, isDone ? 'todo' : 'done');
	}
</script>

<li class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
	<button
		onclick={toggle}
		aria-label="Status umschalten"
		class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 active:scale-95 transition-transform {isDone
			? 'border-emerald-600 bg-emerald-600'
			: 'border-slate-300'}"
	>
		{#if isDone}<span class="text-xs text-white">✓</span>{/if}
	</button>
	<div class="min-w-0 flex-1">
		<p class="truncate {isDone ? 'text-slate-400 line-through' : 'text-slate-900'}">{task.title}</p>
		{#if task.due_at}
			<p class="text-xs {isOverdue ? 'text-red-600' : 'text-slate-500'}">
				{new Date(task.due_at).toLocaleDateString('de-DE')}
			</p>
		{/if}
	</div>
	<button
		onclick={() => tasksState.removeTask(task.id)}
		aria-label="Löschen"
		class="shrink-0 text-slate-400 active:text-red-600"
	>
		<Trash2 size={18} />
	</button>
</li>
