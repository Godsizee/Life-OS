<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import GoalForm from '$lib/features/goals/components/GoalForm.svelte';
	import GoalList from '$lib/features/goals/components/GoalList.svelte';
	import JournalEntryForm from '$lib/features/goals/components/JournalEntryForm.svelte';
	import JournalList from '$lib/features/goals/components/JournalList.svelte';

	let section = $state<'goals' | 'journal'>('goals');

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) goalsState.load(id);
	});
	onDestroy(() => goalsState.unload());
</script>

<svelte:head>
	<title>Ziele & Tagebuch - Life OS</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-2xl font-bold tracking-tight">Ziele & Tagebuch</h1>
</header>

<section class="mb-4 flex gap-2">
	<button
		onclick={() => (section = 'goals')}
		class="rounded-full px-3 py-1 text-xs font-medium {section === 'goals'
			? 'bg-emerald-600 text-white'
			: 'bg-slate-100 text-slate-600'}"
	>
		Ziele
	</button>
	<button
		onclick={() => (section = 'journal')}
		class="rounded-full px-3 py-1 text-xs font-medium {section === 'journal'
			? 'bg-emerald-600 text-white'
			: 'bg-slate-100 text-slate-600'}"
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
