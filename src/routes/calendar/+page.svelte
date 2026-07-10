<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { calendarState } from '$lib/features/calendar/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { isDueOn } from '$lib/features/habits/streak';
	import { toISODate } from '$lib/core/date';
	import EventForm from '$lib/features/calendar/components/EventForm.svelte';
	import AgendaList from '$lib/features/calendar/components/AgendaList.svelte';
	import { Calendar, CheckSquare, Repeat } from 'lucide-svelte';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			calendarState.load(id);
			tasksState.load(id);
			habitsState.load(id);
		}
	});

	onDestroy(() => {
		calendarState.unload();
		tasksState.unload();
		habitsState.unload();
	});

	// ── Welle 5.4: Layer-Toggles (persistiert in localStorage) ────────────────
	const LS_KEY = 'lifeos:calendar-layers';
	let layers = $state({ events: true, tasks: true, habits: true });

	$effect(() => {
		try {
			const raw = localStorage.getItem(LS_KEY);
			if (raw) layers = { ...layers, ...JSON.parse(raw) };
		} catch {}
	});

	function toggleLayer(key: 'events' | 'tasks' | 'habits') {
		layers = { ...layers, [key]: !layers[key] };
		try {
			localStorage.setItem(LS_KEY, JSON.stringify(layers));
		} catch {}
	}

	const todayStart = new Date(new Date().toDateString());

	const upcoming = $derived(
		[
			...(layers.events
				? calendarState.events.map((e) => ({
						id: e.id,
						type: 'event' as const,
						title: e.title,
						start: e.start,
						end: e.end,
						allDay: e.all_day,
						location: e.location,
						rrule: e.rrule
					}))
				: []),
			...(layers.tasks
				? tasksState.tasks
						.filter((t) => t.due_at)
						.map((t) => ({
							id: t.id,
							type: 'task' as const,
							title: t.title,
							start: t.due_at!,
							end: t.due_at!,
							status: t.status,
							priority: t.priority
						}))
				: [])
		]
			.filter((item) => new Date(item.end) >= todayStart)
			.sort((a, b) => a.start.localeCompare(b.start))
	);

	// Routinen-Layer: heute fällige Gewohnheiten (kompakte eigene Liste).
	const today = toISODate(new Date());
	const dueHabitsToday = $derived(
		layers.habits
			? habitsState.habits.filter((h) => !h.archived && isDueOn(h.schedule, new Date()))
			: []
	);

	const layerDefs = [
		{ key: 'events' as const, label: 'Termine', icon: Calendar },
		{ key: 'tasks' as const, label: 'Aufgaben', icon: CheckSquare },
		{ key: 'habits' as const, label: 'Routinen', icon: Repeat }
	];
</script>

<svelte:head>
	<title>Kalender - Life OS</title>
</svelte:head>

<header class="mb-4">
	<h1 class="text-2xl font-bold tracking-tight">Kalender & Termine</h1>
</header>

<!-- Layer-Umschalter -->
<div class="mb-4 flex flex-wrap gap-2">
	{#each layerDefs as def (def.key)}
		{@const Icon = def.icon}
		<button
			onclick={() => toggleLayer(def.key)}
			class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors {layers[
				def.key
			]
				? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
				: 'border-border-color bg-surface-1 text-text-tertiary'}"
			aria-pressed={layers[def.key]}
		>
			<Icon size={13} />
			{def.label}
		</button>
	{/each}
</div>

<section class="mb-4">
	<EventForm />
</section>

<!-- Routinen-Layer -->
{#if dueHabitsToday.length > 0}
	<section class="mb-4">
		<h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-text-tertiary">Routinen heute</h3>
		<ul class="flex flex-col gap-1.5">
			{#each dueHabitsToday as habit (habit.id)}
				{@const logged = habitsState.logsFor(habit.id).includes(today)}
				<li class="flex items-center gap-3 rounded-xl border border-border-color bg-surface-0 p-2.5">
					<button
						onclick={() => habitsState.toggleToday(habit.id)}
						class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {logged
							? 'border-emerald-500 bg-emerald-500 text-white'
							: 'border-border-color text-transparent'}"
						aria-label={logged ? 'Als offen markieren' : 'Als erledigt markieren'}
					>
						✓
					</button>
					<span class="min-w-0 flex-1 truncate text-sm text-text-primary {logged ? 'line-through text-text-tertiary' : ''}">
						{habit.name}
					</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section>
	<AgendaList items={upcoming} />
</section>
