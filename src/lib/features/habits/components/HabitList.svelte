<script lang="ts">
	import { Repeat } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import HabitItem from './HabitItem.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import { DURATION, motionDuration } from '$lib/ui/motion';
	import type { Habit } from '../types';

	let { habits }: { habits: Habit[] } = $props();
</script>

{#if habits.length === 0}
	<EmptyState icon={Repeat} title="Keine Gewohnheiten" hint="Lege deine erste Routine oben an." />
{:else}
	<ul class="flex flex-col gap-2">
		{#each habits as habit (habit.id)}
			<li class="contents" transition:fade={{ duration: motionDuration(DURATION.fast) }} animate:flip={{ duration: motionDuration(DURATION.base) }}>
				<HabitItem {habit} />
			</li>
		{/each}
	</ul>
{/if}
