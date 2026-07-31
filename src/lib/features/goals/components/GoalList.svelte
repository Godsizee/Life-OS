<script lang="ts">
	import { Target, ChevronDown, ChevronUp, Archive } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import GoalItem from './GoalItem.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import { DURATION, motionDuration } from '$lib/ui/motion';
	import { goalsState } from '../store.svelte';
	import type { Goal } from '../types';

	let { goals }: { goals: Goal[] } = $props();

	let showArchived = $state(false);

	const activeGoals = $derived(goals.filter((g) => !g.archived));
	const archivedGoals = $derived(goals.filter((g) => g.archived));

	const roots = $derived(
		activeGoals.filter((g) => g.parent_id === null || !activeGoals.some((p) => p.id === g.parent_id))
	);
	const childrenOf = $derived((id: string) => activeGoals.filter((g) => g.parent_id === id));
	
	const sortedGoals = $derived.by(() => {
		const out = [];
		for (const g of roots) {
			out.push({ goal: g, isChild: false });
			for (const child of childrenOf(g.id)) {
				out.push({ goal: child, isChild: true });
			}
		}
		return out;
	});

	async function toggleArchived() {
		showArchived = !showArchived;
		if (showArchived) {
			await goalsState.loadArchived();
		}
	}
</script>

{#if activeGoals.length === 0 && archivedGoals.length === 0}
	<EmptyState icon={Target} title="Keine Ziele" hint="Lege dein erstes Ziel oben an." />
{:else}
	{#if activeGoals.length > 0}
		<ul class="flex flex-col gap-2">
			{#each sortedGoals as item (item.goal.id)}
				<li
					class={item.isChild ? "ml-4 border-l-2 border-border-color pl-2" : ""}
					transition:fade={{ duration: motionDuration(DURATION.fast) }}
					animate:flip={{ duration: motionDuration(DURATION.base) }}
				>
					<GoalItem goal={item.goal} />
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-xs text-text-tertiary">Keine aktiven Ziele.</p>
	{/if}

	<div class="mt-6 border-t border-border-color pt-3">
		<button
			onclick={toggleArchived}
			class="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
		>
			<Archive size={14} />
			<span>Archiv ({archivedGoals.length})</span>
			{#if showArchived}
				<ChevronUp size={14} />
			{:else}
				<ChevronDown size={14} />
			{/if}
		</button>

		{#if showArchived}
			{#if archivedGoals.length === 0}
				<p class="mt-2 text-xs text-text-tertiary">Keine archivierten Ziele.</p>
			{:else}
				<ul class="mt-3 flex flex-col gap-2 opacity-80">
					{#each archivedGoals as g (g.id)}
						<li>
							<GoalItem goal={g} />
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</div>
{/if}
