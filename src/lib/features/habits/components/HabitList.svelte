<script lang="ts">
	import { Repeat } from 'lucide-svelte';
	import HabitItem from './HabitItem.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import type { Habit } from '../types';

	let { habits }: { habits: Habit[] } = $props();
</script>

{#if habits.length === 0}
	<EmptyState icon={Repeat} title="Keine Gewohnheiten" hint="Lege deine erste Routine oben an." />
{:else}
	<ul class="flex flex-col gap-2">
		{#each habits as habit (habit.id)}
			<HabitItem {habit} />
		{/each}
	</ul>
{/if}
