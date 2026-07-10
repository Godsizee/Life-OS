<script lang="ts">
	import GoalItem from './GoalItem.svelte';
	import type { Goal } from '../types';

	let { goals }: { goals: Goal[] } = $props();
</script>

<ul class="flex flex-col gap-2">
	{#each goals as goal (goal.id)}
		<GoalItem {goal} />
	{:else}
		<p class="text-sm text-slate-500">Keine Ziele.</p>
	{/each}
</ul>
