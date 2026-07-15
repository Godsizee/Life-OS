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
	import { focusState } from '$lib/features/focus/store.svelte';
	import GoalForm from '$lib/features/goals/components/GoalForm.svelte';
	import GoalList from '$lib/features/goals/components/GoalList.svelte';
	import JournalEntryForm from '$lib/features/goals/components/JournalEntryForm.svelte';
	import JournalList from '$lib/features/goals/components/JournalList.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';

	let section = $state<'goals' | 'journal'>(
		page.url.searchParams.get('tab') === 'journal' ? 'journal' : 'goals'
	);

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
		}
		focusState.loadToday();
	});
	onDestroy(() => {
		goalsState.unload();
		tasksState.unload();
		habitsState.unload();
		fitnessState.unload();
		healthState.unload();
		moodState.unload();
	});
</script>

<svelte:head>
	<title>Ziele & Tagebuch - Life OS</title>
</svelte:head>

<PageHeader title="Ziele & Tagebuch" />

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
	<section class="mb-4">
		<GoalForm />
	</section>
	<section>
		<GoalList goals={goalsState.goals} />
	</section>
{:else}
	<section class="mb-4">
		<JournalEntryForm />
	</section>
	<section>
		<JournalList entries={goalsState.journalEntries} />
	</section>
{/if}
