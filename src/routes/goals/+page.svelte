<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import GoalForm from '$lib/features/goals/components/GoalForm.svelte';
	import GoalList from '$lib/features/goals/components/GoalList.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { Plus, BookOpen } from 'lucide-svelte';

	let createOpen = $state(false);

	$effect(() => {
		if (page.url.searchParams.get('tab') === 'journal') {
			goto('/journal', { replaceState: true });
		}
	});
</script>

<svelte:head>
	<title>Ziele - Life OS</title>
</svelte:head>

<PageHeader title="Ziele">
	{#snippet trailing()}
		<div class="flex items-center gap-2">
			<a
				href="/journal"
				class="flex h-12 items-center gap-1.5 rounded-xl border border-border-color bg-surface-1 px-3 text-xs font-semibold text-text-secondary hover:text-text-primary"
			>
				<BookOpen size={16} /> Tagebuch
			</a>
			<button
				onclick={() => (createOpen = true)}
				aria-label="Neues Ziel"
				class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white active:scale-95 transition-transform"
			>
				<Plus size={22} />
			</button>
		</div>
	{/snippet}
</PageHeader>

<Sheet bind:open={createOpen} title="Neues Ziel">
	{#snippet children()}
		<div class="p-4">
			<GoalForm onsubmitted={() => (createOpen = false)} />
		</div>
	{/snippet}
</Sheet>

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
