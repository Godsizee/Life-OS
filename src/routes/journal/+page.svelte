<script lang="ts">
	import { goalsState } from '$lib/features/goals/store.svelte';
	import JournalList from '$lib/features/goals/components/JournalList.svelte';
	import JournalPromptBar from '$lib/features/goals/components/JournalPromptBar.svelte';
	import JournalStreakBadge from '$lib/features/goals/components/JournalStreakBadge.svelte';
	import JournalOnThisDay from '$lib/features/goals/components/JournalOnThisDay.svelte';
	import JournalEntrySheet from '$lib/features/goals/components/JournalEntrySheet.svelte';
	import { calculateJournalStreak, getOnThisDay } from '$lib/features/goals/journal-stats';
	import { filterJournal, monthsWithEntries } from '$lib/features/goals/journal-filter';
	import type { JournalKind } from '$lib/features/goals/types';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import { page } from '$app/stores';

	let journalSheetOpen = $state(false);
	let journalDate = $state<string | null>(null);
	let journalKind = $state<JournalKind>('daily');

	let query = $state('');
	// Deep-Link vom Weekly Review: /journal?kind=weekly.
	const kindParam = $page.url.searchParams.get('kind');
	let selectedKind = $state<JournalKind | null>(kindParam === 'daily' || kindParam === 'weekly' ? kindParam : null);
	let selectedMonth = $state('');

	const streak = $derived(calculateJournalStreak(goalsState.journalEntries));
	const onThisDay = $derived(getOnThisDay(goalsState.journalEntries));
	const availableMonths = $derived(monthsWithEntries(goalsState.journalEntries));

	const filteredEntries = $derived(
		filterJournal(goalsState.journalEntries, {
			query,
			kind: selectedKind,
			month: selectedMonth || null,
			mood: null
		})
	);

	function openJournal(date: string, kind: JournalKind = 'daily') {
		journalDate = date;
		journalKind = kind;
		journalSheetOpen = true;
	}
</script>

<svelte:head>
	<title>Tagebuch - Life OS</title>
</svelte:head>

<PageHeader title="Tagebuch">
	{#snippet trailing()}
		<JournalStreakBadge {streak} />
	{/snippet}
</PageHeader>

<div class="mb-4 space-y-4">
	<JournalPromptBar onOpen={(d) => openJournal(d, 'daily')} />
	<JournalOnThisDay entries={onThisDay} onOpen={(e) => openJournal(e.date, e.kind)} />
</div>

<!-- Suche & Filter Bar -->
<section class="mb-4 space-y-2.5 rounded-2xl border border-border-color bg-surface-0 p-3">
	<div class="flex gap-2">
		<div class="flex-1">
			<Input placeholder="Tagebuch durchsuchen…" bind:value={query} />
		</div>
		{#if availableMonths.length > 0}
			<div class="w-36">
				<Select bind:value={selectedMonth}>
					<option value="">Alle Monate</option>
					{#each availableMonths as m (m)}
						<option value={m}>
							{new Date(m + '-01').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
						</option>
					{/each}
				</Select>
			</div>
		{/if}
	</div>

	<!-- Art-Filter -->
	<div class="flex gap-2">
		<button
			onclick={() => (selectedKind = null)}
			class="rounded-full px-3 py-1 text-xs font-medium {selectedKind === null
				? 'bg-primary-600 text-white'
				: 'bg-surface-2 text-text-secondary border border-border-color/30'}"
		>
			Alle
		</button>
		<button
			onclick={() => (selectedKind = 'daily')}
			class="rounded-full px-3 py-1 text-xs font-medium {selectedKind === 'daily'
				? 'bg-primary-600 text-white'
				: 'bg-surface-2 text-text-secondary border border-border-color/30'}"
		>
			Täglich
		</button>
		<button
			onclick={() => (selectedKind = 'weekly')}
			class="rounded-full px-3 py-1 text-xs font-medium {selectedKind === 'weekly'
				? 'bg-primary-600 text-white'
				: 'bg-surface-2 text-text-secondary border border-border-color/30'}"
		>
			Wöchentlich
		</button>
	</div>
</section>

<section>
	<JournalList entries={filteredEntries} {query} onEdit={openJournal} />
</section>

<JournalEntrySheet
	bind:open={journalSheetOpen}
	date={journalDate}
	kind={journalKind}
/>
