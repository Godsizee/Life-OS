<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { calendarState } from '$lib/features/calendar/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { linksState } from '$lib/features/links/store.svelte';
	import { isOpenToday, isCompleted } from '$lib/features/habits/streak';
	import { toISODate } from '$lib/core/date';
	import { expandEvents } from '$lib/features/calendar/occurrences';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import EventForm from '$lib/features/calendar/components/EventForm.svelte';
	import AgendaList from '$lib/features/calendar/components/AgendaList.svelte';
	import MonthView from '$lib/features/calendar/components/MonthView.svelte';
	import WeekView from '$lib/features/calendar/components/WeekView.svelte';
	import { Calendar, CheckSquare, Repeat, Plus } from 'lucide-svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';

	let createOpen = $state(false);

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			calendarState.load(id);
			tasksState.load(id);
			habitsState.load(id);
			fitnessState.load(id);
			linksState.load(id);
		}
	});
	onDestroy(() => {
		calendarState.unload();
		tasksState.unload();
		habitsState.unload();
		fitnessState.unload();
		linksState.unload();
	});

	// ── View-Umschalter (persistiert) ────────────────────────────────
	type View = 'agenda' | 'month' | 'week';
	const VIEW_KEY = 'lifeos:calendar-view';
	let view = $state<View>('agenda');
	$effect(() => {
		try {
			const raw = localStorage.getItem(VIEW_KEY);
			if (raw === 'agenda' || raw === 'month' || raw === 'week') view = raw;
		} catch {}
	});
	function setView(v: View) {
		view = v;
		try { localStorage.setItem(VIEW_KEY, v); } catch {}
	}

	// ── Layer-Toggles ─────────────────────────────────────────────────
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
		try { localStorage.setItem(LS_KEY, JSON.stringify(layers)); } catch {}
	}

	const todayStart = new Date(new Date().toDateString());
	const today = toISODate(new Date());

	// Navigations-State (Monat/Woche/Tag)
	let selectedDay = $state(today);
	let monthAnchor = $state(new Date());
	let weekAnchor = $state(new Date());

	// Fenster für die Expansion: großzügig um heute (deckt Agenda-Horizont + Navigation).
	const rangeStart = $derived.by(() => {
		const d = new Date();
		d.setMonth(d.getMonth() - 2, 1);
		return d;
	});
	const rangeEnd = $derived.by(() => {
		const d = new Date();
		d.setMonth(d.getMonth() + 4, 0);
		return d;
	});

	const eventOccurrences = $derived(
		layers.events ? expandEvents(calendarState.events, calendarState.overrides, rangeStart, rangeEnd) : []
	);

	const DEFAULT_COLOR = '#6366f1';
	const colorMap = $derived(new Map(calendarState.calendars.map((c) => [c.id, c.color ?? DEFAULT_COLOR])));
	function colorFor(calendarId: string): string {
		return colorMap.get(calendarId) ?? DEFAULT_COLOR;
	}

	// Agenda-Items (Events-Occurrences + fällige Tasks), ab heute.
	const upcoming = $derived(
		[
			...eventOccurrences.map((o) => ({
				id: o.key,
				sourceId: o.event.id,
				type: 'event' as const,
				title: o.title,
				start: o.start,
				end: o.end,
				allDay: o.allDay,
				location: o.location,
				rrule: o.event.rrule,
				occurrenceDate: o.occurrenceDate
			})),
			...(layers.tasks
				? tasksState.tasks
						.filter((t) => t.due_at)
						.map((t) => ({
							id: t.id,
							sourceId: t.id,
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

	const daySelectedItems = $derived(upcoming.filter((i) => toISODate(new Date(i.start)) === selectedDay));

	const dueHabitsToday = $derived(
		layers.habits ? habitsState.habits.filter((h) => !h.archived && isOpenToday(h, habitsState.entriesFor(h.id))) : []
	);

	const layerDefs = [
		{ key: 'events' as const, label: 'Termine', icon: Calendar },
		{ key: 'tasks' as const, label: 'Aufgaben', icon: CheckSquare },
		{ key: 'habits' as const, label: 'Routinen', icon: Repeat }
	];
	const viewDefs = [
		{ key: 'agenda' as const, label: 'Agenda' },
		{ key: 'month' as const, label: 'Monat' },
		{ key: 'week' as const, label: 'Woche' }
	];
</script>

<svelte:head>
	<title>Kalender - Life OS</title>
</svelte:head>

<PageHeader title="Kalender & Termine">
	{#snippet trailing()}
		<button onclick={() => (createOpen = true)} aria-label="Neuer Termin"
			class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white active:scale-95 transition-transform">
			<Plus size={22} />
		</button>
	{/snippet}
</PageHeader>

<Sheet bind:open={createOpen} title="Neuer Termin">
	{#snippet children()}
		<div class="p-4"><EventForm onsubmitted={() => (createOpen = false)} /></div>
	{/snippet}
</Sheet>

<!-- View-Umschalter -->
<div class="mb-3 inline-flex rounded-xl bg-surface-1 p-1">
	{#each viewDefs as v (v.key)}
		<button onclick={() => setView(v.key)}
			class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {view === v.key ? 'bg-surface-0 text-text-primary shadow-sm' : 'text-text-secondary'}">
			{v.label}
		</button>
	{/each}
</div>

<!-- Layer-Umschalter -->
<div class="mb-4 flex flex-wrap gap-2">
	{#each layerDefs as def (def.key)}
		{@const Icon = def.icon}
		<Chip selected={layers[def.key]} onclick={() => toggleLayer(def.key)}>
			<Icon size={13} /> {def.label}
		</Chip>
	{/each}
</div>

<!-- Routinen-Layer (nur Agenda) -->
{#if view === 'agenda' && dueHabitsToday.length > 0}
	<section class="mb-4">
		<h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-text-tertiary">Routinen heute</h3>
		<ul class="flex flex-col gap-1.5">
			{#each dueHabitsToday as habit (habit.id)}
				{@const logged = isCompleted(habit, habitsState.entryToday(habit.id))}
				<li class="flex items-center gap-3 rounded-xl border border-border-color bg-surface-0 p-2.5">
					<button onclick={() => habitsState.toggleToday(habit.id)}
						class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {logged ? 'border-primary-500 bg-primary-500 text-white' : 'border-border-color text-transparent'}"
						aria-label={logged ? 'Als offen markieren' : 'Als erledigt markieren'}>✓</button>
					<span class="min-w-0 flex-1 truncate text-sm text-text-primary {logged ? 'line-through text-text-tertiary' : ''}">{habit.name}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section>
	{#if calendarState.loading}
		<div class="flex flex-col gap-2"><Skeleton height="4rem" /><Skeleton height="4rem" /><Skeleton height="4rem" /></div>
	{:else if view === 'agenda'}
		<AgendaList items={upcoming} />
	{:else if view === 'month'}
		<MonthView occurrences={eventOccurrences} {colorFor} bind:selected={selectedDay} bind:month={monthAnchor} />
		<div class="mt-4">
			<h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-text-tertiary">
				{new Date(selectedDay).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })}
			</h3>
			<AgendaList items={daySelectedItems} />
		</div>
	{:else}
		<WeekView occurrences={eventOccurrences} {colorFor} bind:anchor={weekAnchor} bind:activeDay={selectedDay} />
	{/if}
</section>
