<script lang="ts">
	import { onDestroy } from 'svelte';
	import { toISODate } from '$lib/core/date';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { notesState } from '$lib/features/notes/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { isDueOn } from '$lib/features/habits/streak';
	import { calendarState } from '$lib/features/calendar/store.svelte';
	import { shoppingState } from '$lib/features/shopping/store.svelte';
	import TaskList from '$lib/features/tasks/components/TaskList.svelte';
	import HabitList from '$lib/features/habits/components/HabitList.svelte';
	import EventItem from '$lib/features/calendar/components/EventItem.svelte';
	import ShoppingList from '$lib/features/shopping/components/ShoppingList.svelte';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			tasksState.load(id);
			notesState.load(id);
			habitsState.load(id);
			calendarState.load(id);
			shoppingState.load(id);
		}
	});
	onDestroy(() => {
		tasksState.unload();
		notesState.unload();
		habitsState.unload();
		calendarState.unload();
		shoppingState.unload();
	});

	const dueTasks = $derived(
		tasksState.tasks
			.filter((t) => t.status !== 'done')
			.sort((a, b) => (a.due_at ?? '9999').localeCompare(b.due_at ?? '9999'))
			.slice(0, 5)
	);
	const pinnedNotes = $derived(notesState.notes.filter((n) => n.pinned).slice(0, 3));
	const dueHabitsToday = $derived(
		habitsState.habits.filter(
			(h) => isDueOn(h.schedule, new Date()) && !habitsState.isLoggedToday(h.id)
		)
	);
	const todayEvents = $derived(
		calendarState.events
			.filter((e) => toISODate(new Date(e.start)) === toISODate(new Date()))
			.sort((a, b) => a.start.localeCompare(b.start))
	);
	const shoppingHighlights = $derived(shoppingState.items.filter((i) => !i.checked).slice(0, 5));
</script>

<svelte:head>
	<title>Heute - Life OS</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-2xl font-bold tracking-tight">Heute</h1>
	<p class="text-slate-500">Willkommen im Life OS</p>
</header>

<section class="grid gap-4">
	<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
		<h2 class="font-semibold text-slate-700">Aktuelle Aufgaben</h2>
		<div class="mt-2">
			<TaskList tasks={dueTasks} />
		</div>
	</div>

	{#if pinnedNotes.length > 0}
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<h2 class="font-semibold text-slate-700">Angepinnte Notizen</h2>
			<ul class="mt-2 flex flex-col gap-2">
				{#each pinnedNotes as note (note.id)}
					<li class="truncate text-sm text-slate-700">{note.title}</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if todayEvents.length > 0}
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<h2 class="font-semibold text-slate-700">Heute Termine</h2>
			<ul class="mt-2 flex flex-col gap-2">
				{#each todayEvents as event (event.id)}
					<EventItem {event} />
				{/each}
			</ul>
		</div>
	{/if}

	{#if dueHabitsToday.length > 0}
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<h2 class="font-semibold text-slate-700">Gewohnheiten heute</h2>
			<div class="mt-2">
				<HabitList habits={dueHabitsToday} />
			</div>
		</div>
	{/if}

	{#if shoppingHighlights.length > 0}
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<h2 class="font-semibold text-slate-700">Einkauf</h2>
			<div class="mt-2">
				<ShoppingList items={shoppingHighlights} />
			</div>
		</div>
	{/if}
</section>
