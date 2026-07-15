<script lang="ts">
	import { CheckSquare } from 'lucide-svelte';
	import TaskItem from './TaskItem.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import type { Task } from '../types';

	let { tasks }: { tasks: Task[] } = $props();
</script>

{#if tasks.length === 0}
	<EmptyState icon={CheckSquare} title="Keine Aufgaben" hint="Erstelle deine erste Aufgabe oben." />
{:else}
	<ul class="flex flex-col gap-2">
		{#each tasks as task (task.id)}
			<TaskItem {task} />
		{/each}
	</ul>
{/if}
