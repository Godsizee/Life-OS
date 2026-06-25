<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import HabitForm from '$lib/features/habits/components/HabitForm.svelte';
	import HabitList from '$lib/features/habits/components/HabitList.svelte';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) habitsState.load(id);
	});
	onDestroy(() => habitsState.unload());
</script>

<svelte:head>
	<title>Gewohnheiten - Life OS</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-2xl font-bold tracking-tight">Gewohnheiten</h1>
</header>

<section class="mb-4">
	<HabitForm />
</section>

<section>
	<HabitList habits={habitsState.habits} />
</section>
