<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { healthState } from '$lib/features/health/store.svelte';
	import { moodState } from '$lib/features/mood/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { timeTrackingState } from '$lib/features/timetracking/store.svelte';
	import GoalForm from '$lib/features/goals/components/GoalForm.svelte';
	import GoalList from '$lib/features/goals/components/GoalList.svelte';
	import JournalList from '$lib/features/goals/components/JournalList.svelte';
	import JournalPromptBar from '$lib/features/goals/components/JournalPromptBar.svelte';
	import JournalStreakBadge from '$lib/features/goals/components/JournalStreakBadge.svelte';
	import JournalOnThisDay from '$lib/features/goals/components/JournalOnThisDay.svelte';
	import JournalEntrySheet from '$lib/features/goals/components/JournalEntrySheet.svelte';
	import { calculateJournalStreak, getOnThisDay } from '$lib/features/goals/journal-stats';
	import type { JournalKind } from '$lib/features/goals/types';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { Plus } from 'lucide-svelte';

	let section = $state<'goals' | 'journal'>(
		page.url.searchParams.get('tab') === 'journal' ? 'journal' : 'goals'
	);
	let createOpen = $state(false);

	let journalSheetOpen = $state(false);
	let journalDate = $state<string | null>(null);
	let journalKind = $state<JournalKind>('daily');

	const streak = $derived(calculateJournalStreak(goalsState.journalEntries));
	const onThisDay = $derived(getOnThisDay(goalsState.journalEntries));

	function openJournal(date: string, kind: JournalKind = 'daily') {
		journalDate = date;
		journalKind = kind;
		journalSheetOpen = true;
	}

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			goalsState.load(id);
			// Für den „Tag in Zahlen"-Snapshot (5.5) und PR-Ziele (5.2) nötig.
			tasksState.load(id);
			habitsState.load(id);
			fitnessState.load(id);
			healthState.load();
			moodState.load();
			void timeTrackingState.load();
		}
	});
	onDestroy(() => {
		goalsState.unload();
		tasksState.unload();
		habitsState.unload();
		fitnessState.unload();
		healthState.unload();
		moodState.unload();
		timeTrackingState.unload();
	});
</script>

<svelte:head>
	<title>Ziele & Tagebuch - Life OS</title>
</svelte:head>

<PageHeader title="Ziele & Tagebuch">
	{#snippet trailing()}
		{#if section === 'goals'}
			<button
				onclick={() => (createOpen = true)}
				aria-label="Neues Ziel"
				class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white active:scale-95 transition-transform"
			>
				<Plus size={22} />
			</button>
		{/if}
	{/snippet}
</PageHeader>

<Sheet bind:open={createOpen} title="Neues Ziel">
	{#snippet children()}
		<div class="p-4">
			<GoalForm onsubmitted={() => (createOpen = false)} />
		</div>
	{/snippet}
</Sheet>

<section class="mb-4 flex gap-2">
	<button
		onclick={() => (section = 'goals')}
		class="rounded-full px-3 py-1 text-xs font-medium {section === 'goals'
			? 'bg-primary-600 text-white'
			: 'bg-surface-2 text-text-secondary border border-border-color/30'}"
	>
		Ziele
	</button>
	<button
		onclick={() => (section = 'journal')}
		class="rounded-full px-3 py-1 text-xs font-medium {section === 'journal'
			? 'bg-primary-600 text-white'
			: 'bg-surface-2 text-text-secondary border border-border-color/30'}"
	>
		Tagebuch
	</button>
</section>

{#if section === 'goals'}
	<section>
		{#if goalsState.loading}
			<div class="flex flex-col gap-2">
				<Skeleton height="5rem" />
				<Skeleton height="5rem" />
				<Skeleton height="5rem" />
			</div>
		{:else}
			<GoalList goals={goalsState.goals} />
		{/if}
	</section>
{:else}
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-sm font-bold text-text-primary">Dein Tagebuch</h2>
		<JournalStreakBadge {streak} />
	</div>

	<div class="mb-4 space-y-4">
		<JournalPromptBar onOpen={(d) => openJournal(d, 'daily')} />
		<JournalOnThisDay entries={onThisDay} onOpen={(e) => openJournal(e.date, e.kind)} />
	</div>

	<section>
		<JournalList entries={goalsState.journalEntries} onEdit={openJournal} />
	</section>

	<JournalEntrySheet
		bind:open={journalSheetOpen}
		date={journalDate}
		kind={journalKind}
	/>
{/if}
