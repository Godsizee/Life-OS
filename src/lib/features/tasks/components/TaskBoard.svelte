<script lang="ts">
	import type { Task, TaskStatus } from '../types';
	import { tasksState } from '../store.svelte';
	import { buildTaskTree, subtaskProgress, assignColumnPositions } from '../utils';
	import Card from '$lib/ui/Card.svelte';
	import { Repeat, AlignLeft } from 'lucide-svelte';
	import { formatRRule } from '../recurrence';

	let { tasks, onopen }: { tasks: Task[]; onopen: (t: Task) => void } = $props();

	const COLUMNS: { status: TaskStatus; label: string }[] = [
		{ status: 'todo', label: 'Offen' },
		{ status: 'doing', label: 'In Arbeit' },
		{ status: 'done', label: 'Erledigt' }
	];
	const childrenById = $derived(new Map(buildTaskTree(tasks).map((n) => [n.task.id, n.children])));
	function column(status: TaskStatus): Task[] {
		return tasks.filter((t) => !t.parent_id && t.status === status)
			.sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
	}
	let draggingId: string | null = null;

	function onDragStart(e: DragEvent, id: string) {
		draggingId = id;
		e.dataTransfer?.setData('text/plain', id);
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}
	async function onDrop(e: DragEvent, status: TaskStatus) {
		e.preventDefault();
		const id = draggingId ?? e.dataTransfer?.getData('text/plain');
		draggingId = null;
		if (!id) return;
		const task = tasksState.tasks.find((t) => t.id === id);
		if (!task || task.parent_id) return;
		if (task.status !== status) await tasksState.setStatus(id, status);
		const ordered = [...column(status).filter((t) => t.id !== id).map((t) => t.id), id];
		for (const p of assignColumnPositions(ordered)) await tasksState.moveTask(p.id, { position: p.position });
	}
</script>

<div class="grid grid-cols-3 gap-4">
	{#each COLUMNS as col (col.status)}
		<div class="rounded-2xl border border-border-color bg-surface-1 p-3"
				 ondragover={(e) => e.preventDefault()} ondrop={(e) => onDrop(e, col.status)}>
			<h3 class="mb-2 text-sm font-bold text-text-secondary">{col.label} ({column(col.status).length})</h3>
			<div class="flex min-h-16 flex-col gap-2">
				{#each column(col.status) as task (task.id)}
					{@const progress = subtaskProgress(childrenById.get(task.id) ?? [])}
					{@const isOverdue = !['done'].includes(task.status) && !!task.due_at && new Date(task.due_at) < new Date()}
					<div draggable="true" ondragstart={(e) => onDragStart(e, task.id)}
							 onclick={() => onopen(task)}
							 onkeydown={(e) => e.key === 'Enter' && onopen(task)}
							 role="button" tabindex="0"
							 class="cursor-grab active:cursor-grabbing">
						<Card>
							{#snippet children()}
								<div class="p-3">
									<div class="flex items-center gap-1.5 mb-1.5">
										{#if task.priority === 'high'}
											<span class="inline-block h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
										{:else if task.priority === 'low'}
											<span class="inline-block h-2 w-2 rounded-full bg-slate-400 shrink-0"></span>
										{/if}
										<p class="text-sm font-medium {task.status === 'done' ? 'text-text-tertiary line-through' : 'text-text-primary'}">{task.title}</p>
									</div>
									<div class="flex items-center gap-1.5 flex-wrap">
										{#if task.due_at}
											<span class="text-xs shrink-0 {isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-text-secondary'}">
												{new Date(task.due_at).toLocaleDateString('de-DE')}
											</span>
										{/if}
										{#if task.description}
											<AlignLeft size={12} class="text-text-tertiary shrink-0" />
										{/if}
										{#if progress.total > 0}
											<span class="inline-flex items-center rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
												{progress.done}/{progress.total}
											</span>
										{/if}
										{#if task.rrule}
											<span class="inline-flex items-center gap-1 rounded bg-primary-50 dark:bg-primary-950 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:text-primary-300">
												<Repeat size={10} />
												{formatRRule(task.rrule)}
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
							{/snippet}
						</Card>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
