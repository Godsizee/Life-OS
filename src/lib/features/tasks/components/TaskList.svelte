<script lang="ts">
	import { CheckSquare } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import TaskItem from './TaskItem.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import { DURATION, motionDuration } from '$lib/ui/motion';
	import type { Task } from '../types';

	let { tasks }: { tasks: Task[] } = $props();
</script>

{#if tasks.length === 0}
	<EmptyState icon={CheckSquare} title="Keine Aufgaben" hint="Erstelle deine erste Aufgabe oben." />
{:else}
	<ul class="flex flex-col gap-2">
		{#each tasks as task (task.id)}
			<li class="contents" transition:fade={{ duration: motionDuration(DURATION.fast) }} animate:flip={{ duration: motionDuration(DURATION.base) }}>
				<TaskItem {task} />
			</li>
		{/each}
	</ul>
{/if}
