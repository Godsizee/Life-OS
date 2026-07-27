<script lang="ts">
	import { Target } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import GoalItem from './GoalItem.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import { DURATION, motionDuration } from '$lib/ui/motion';
	import type { Goal } from '../types';

	let { goals }: { goals: Goal[] } = $props();

	// Genau eine Ebene: Wurzelziele in Reihenfolge, Kinder direkt darunter eingerückt.
	// Verwaiste Kinder (Elternziel gelöscht/gefiltert) laufen als Wurzel mit — sie
	// dürfen nie unsichtbar werden.
	const roots = $derived(
		goals.filter((g) => g.parent_id === null || !goals.some((p) => p.id === g.parent_id))
	);
	const childrenOf = $derived((id: string) => goals.filter((g) => g.parent_id === id));
	
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
</script>

{#if goals.length === 0}
	<EmptyState icon={Target} title="Keine Ziele" hint="Lege dein erstes Ziel oben an." />
{:else}
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
{/if}
