<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { calendarState } from '$lib/features/calendar/store.svelte';
	import EventForm from '$lib/features/calendar/components/EventForm.svelte';
	import AgendaList from '$lib/features/calendar/components/AgendaList.svelte';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) calendarState.load(id);
	});
	onDestroy(() => calendarState.unload());

	const upcoming = $derived(
		calendarState.events
			.filter((e) => new Date(e.end) >= new Date(new Date().toDateString()))
			.sort((a, b) => a.start.localeCompare(b.start))
	);
</script>

<svelte:head>
	<title>Kalender - Life OS</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-2xl font-bold tracking-tight">Kalender</h1>
</header>

<section class="mb-4">
	<EventForm />
</section>

<section>
	<AgendaList events={upcoming} />
</section>
