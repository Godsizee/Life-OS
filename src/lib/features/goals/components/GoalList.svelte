<script lang="ts">
	import { Target } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import GoalItem from './GoalItem.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import { DURATION, motionDuration } from '$lib/ui/motion';
	import type { Goal } from '../types';

	let { goals }: { goals: Goal[] } = $props();
</script>

{#if goals.length === 0}
	<EmptyState icon={Target} title="Keine Ziele" hint="Lege dein erstes Ziel oben an." />
{:else}
	<ul class="flex flex-col gap-2">
		{#each goals as goal (goal.id)}
			<li class="contents" transition:fade={{ duration: motionDuration(DURATION.fast) }} animate:flip={{ duration: motionDuration(DURATION.base) }}>
				<GoalItem {goal} />
			</li>
		{/each}
	</ul>
{/if}
