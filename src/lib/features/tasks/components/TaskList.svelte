<script lang="ts">
	import { CheckSquare } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import TaskItem from './TaskItem.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import { DURATION, motionDuration } from '$lib/ui/motion';
	import type { Task } from '../types';
	import { buildTaskTree, subtaskProgress } from '../utils';

	let { tasks, onopen }: { tasks: Task[]; onopen?: (task: Task) => void } = $props();
	
	const tree = $derived(buildTaskTree(tasks));
</script>

{#if tasks.length === 0}
	<EmptyState icon={CheckSquare} title="Keine Aufgaben" hint="Erstelle deine erste Aufgabe oben." />
{:else}
	<ul class="flex flex-col gap-2">
		{#each tree as node (node.task.id)}
			<li class="flex flex-col gap-2" transition:fade={{ duration: motionDuration(DURATION.fast) }} animate:flip={{ duration: motionDuration(DURATION.base) }}>
				<TaskItem task={node.task} progress={subtaskProgress(node.children)} {onopen} />
				{#each node.children as child (child.id)}
					<div class="ml-8" transition:fade={{ duration: motionDuration(DURATION.fast) }}>
						<TaskItem task={child} {onopen} />
					</div>
				{/each}
			</li>
		{/each}
	</ul>
{/if}
