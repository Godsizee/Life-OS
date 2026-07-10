<script lang="ts">
	import HabitItem from './HabitItem.svelte';
	import type { Habit } from '../types';

	let { habits }: { habits: Habit[] } = $props();
</script>

<ul class="flex flex-col gap-2">
	{#each habits as habit (habit.id)}
		<HabitItem {habit} />
	{:else}
		<p class="text-sm text-slate-500">Keine Gewohnheiten.</p>
	{/each}
</ul>
