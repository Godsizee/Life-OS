<script lang="ts">
	import { History } from 'lucide-svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';

	import { timelineState } from '$lib/features/timeline/store.svelte';
	import { groupByDay } from '$lib/features/timeline/build';
	import { TIMELINE_MODULES } from '$lib/features/timeline/modules';
	import TimelineDayGroup from '$lib/features/timeline/components/TimelineDayGroup.svelte';
	import type { TimelineModule } from '$lib/features/timeline/module-ids';

	let filterModule = $state<TimelineModule | 'all'>('all');
	let visibleGroups = $state(20);

	// Wenn sich der Filter ändert, resetten wir die Paginierung
	$effect(() => {
		filterModule;
		visibleGroups = 20;
	});

	const filteredItems = $derived(
		filterModule === 'all'
			? timelineState.items
			: timelineState.items.filter((i) => i.module === filterModule)
	);

	const gruppen = $derived(groupByDay(filteredItems));
	const renderedGroups = $derived(gruppen.slice(0, visibleGroups));
	const hasMore = $derived(visibleGroups < gruppen.length);

	function counts(mod: string) {
		if (mod === 'all') return timelineState.items.length;
		return timelineState.items.filter((i) => i.module === mod).length;
	}
</script>

<svelte:head>
	<title>Timeline - Aktivitätenverlauf</title>
</svelte:head>

{#snippet rangeToggle()}
	<div class="flex items-center gap-1 rounded-xl bg-surface-2 p-1">
		{#each [30, 90, 365, 'all'] as z}
			<button
				onclick={() => timelineState.setRange(z as any)}
				class="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-xs font-bold transition-all md:flex-none md:px-3 {timelineState.range ===
				z
					? 'bg-surface-0 text-primary-active premium-shadow'
					: 'text-text-secondary hover:text-text-primary'}"
				title={z === 'all' ? 'Bei viel Historie kann das einen Moment dauern' : `${z} Tage`}
			>
				{z === 'all' ? 'Alles' : `${z} T.`}
			</button>
		{/each}
	</div>
{/snippet}

<div class="space-y-6">
	<!--
		Der Range-Toggle ist ~240px breit und liesse im PageHeader-Slot auf schmalen
		Displays nur Platz fuer wenige Pixel Titel. Deshalb steht er dort erst ab
		`md` und darunter als eigene Zeile unter dem Header.
	-->
	<PageHeader title="Timeline" subtitle="Verfolge all deine Aktivitäten und Fortschritte chronologisch.">
		{#snippet trailing()}
			<div class="hidden md:block">
				{@render rangeToggle()}
			</div>
		{/snippet}
	</PageHeader>

	<div class="md:hidden">
		{@render rangeToggle()}
	</div>

	<!-- Filter Chip-row -->
	<div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
		<Chip selected={filterModule === 'all'} onclick={() => (filterModule = 'all')}>
			Alles <span class="ml-1 opacity-60 text-[10px] tabular-nums">({counts('all')})</span>
		</Chip>
		{#each TIMELINE_MODULES as meta (meta.id)}
			<Chip selected={filterModule === meta.id} onclick={() => (filterModule = meta.id)}>
				{meta.label} <span class="ml-1 opacity-60 text-[10px] tabular-nums">({counts(meta.id)})</span>
			</Chip>
		{/each}
	</div>

	<!-- Timeline List -->
	{#if gruppen.length === 0}
		<EmptyState 
			icon={History} 
			title={filterModule === 'all' ? 'Noch nichts aufgezeichnet' : 'Keine Einträge in diesem Bereich'} 
			hint={filterModule === 'all' ? 'Sobald du etwas erledigst, erscheint es hier.' : 'Wähle einen anderen Bereich oder „Alles".'}
		/>
	{:else}
		<div class="space-y-8 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-color">
			{#each renderedGroups as group (group.date)}
				<TimelineDayGroup {group} />
			{/each}

			{#if hasMore}
				<div class="pt-4 flex justify-center relative z-10">
					<button
						onclick={() => (visibleGroups += 20)}
						class="rounded-xl bg-surface-2 px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
					>
						Weitere 20 Tage laden
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
