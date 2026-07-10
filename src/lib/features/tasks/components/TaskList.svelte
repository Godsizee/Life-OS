<script lang="ts">
	import TaskItem from './TaskItem.svelte';
	import type { Task } from '../types';

	let { tasks }: { tasks: Task[] } = $props();
</script>

<ul class="flex flex-col gap-2">
	{#each tasks as task (task.id)}
		<TaskItem {task} />
	{:else}
		<p class="text-sm text-slate-500">Keine Aufgaben.</p>
	{/each}
</ul>
