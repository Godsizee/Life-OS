<script lang="ts">
	import { calendarState } from '$lib/features/calendar/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { isOpenToday, isCompleted, weekProgress } from '$lib/features/habits/streak';
	import { toISODate } from '$lib/core/date';
	import { expandEvents } from '$lib/features/calendar/occurrences';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import EventForm from '$lib/features/calendar/components/EventForm.svelte';
	import AgendaList from '$lib/features/calendar/components/AgendaList.svelte';
	import MonthView from '$lib/features/calendar/components/MonthView.svelte';
	import WeekView from '$lib/features/calendar/components/WeekView.svelte';
	import CalendarManagerSheet from '$lib/features/calendar/components/CalendarManagerSheet.svelte';
	import { Calendar as CalendarIcon, CheckSquare, Repeat, Plus, Settings, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import IconButton from '$lib/ui/IconButton.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';

	let createOpen = $state(false);
	let managerOpen = $state(false);

	let hiddenCalendarIds = $state<string[]>([]);
	$effect(() => {
		try {
			const raw = localStorage.getItem('lifeos:calendar-hidden');
			if (raw) hiddenCalendarIds = JSON.parse(raw);
		} catch {}
	});

	// Laden/Entladen liegt zentral in core/workspace-data.ts (+layout.svelte).

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
	const DEFAULT_LAYERS = { events: true, tasks: true, habits: true };
	let layers = $state({ ...DEFAULT_LAYERS });
	$effect(() => {
		try {
			const raw = localStorage.getItem(LS_KEY);
			if (raw) layers = { ...DEFAULT_LAYERS, ...JSON.parse(raw) };
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

	let agendaMode = $state<'future' | 'all'>('future');
	let sprungDatum = $state(today);

	$effect(() => {
		sprungDatum = selectedDay;
	});

	function heute() {
		const now = new Date();
		monthAnchor = new Date(now);
		weekAnchor = new Date(now);
		selectedDay = toISODate(now);
	}

	function zurueck() {
		if (view === 'month') {
			monthAnchor = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1);
		} else if (view === 'week') {
			weekAnchor = new Date(weekAnchor.getTime() - 7 * 24 * 60 * 60 * 1000);
		} else {
			// Agenda
			const d = new Date(selectedDay);
			d.setDate(d.getDate() - 1);
			selectedDay = toISODate(d);
		}
	}

	function vor() {
		if (view === 'month') {
			monthAnchor = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1);
		} else if (view === 'week') {
			weekAnchor = new Date(weekAnchor.getTime() + 7 * 24 * 60 * 60 * 1000);
		} else {
			// Agenda
			const d = new Date(selectedDay);
			d.setDate(d.getDate() + 1);
			selectedDay = toISODate(d);
		}
	}

	function springe() {
		if (!sprungDatum) return;
		const d = new Date(sprungDatum);
		if (isNaN(d.getTime())) return;
		selectedDay = sprungDatum;
		monthAnchor = new Date(d);
		weekAnchor = new Date(d);
	}

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

	const visibleEvents = $derived(
		calendarState.events.filter((e) => !hiddenCalendarIds.includes(e.calendar_id))
	);

	const eventOccurrences = $derived(
		layers.events ? expandEvents(visibleEvents, calendarState.overrides, rangeStart, rangeEnd) : []
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
			.filter((item) => agendaMode === 'all' || new Date(item.end) >= todayStart)
			.sort((a, b) => a.start.localeCompare(b.start))
	);

	const daySelectedItems = $derived(upcoming.filter((i) => toISODate(new Date(i.start)) === selectedDay));

	const dueHabitsToday = $derived(
		layers.habits ? habitsState.habits.filter((h) => !h.archived && isOpenToday(h, habitsState.entriesFor(h.id))) : []
	);

	const layerDefs = [
		{ key: 'events' as const, label: 'Termine', icon: CalendarIcon },
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
		<div class="flex items-center gap-2">
			<button onclick={() => (managerOpen = true)} aria-label="Kalender verwalten"
				class="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-1 text-text-secondary hover:bg-surface-2 transition-colors">
				<Settings size={22} />
			</button>
			<button onclick={() => (createOpen = true)} aria-label="Neuer Termin"
				class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white active:scale-95 transition-transform">
				<Plus size={22} />
			</button>
		</div>
	{/snippet}
</PageHeader>

<CalendarManagerSheet bind:open={managerOpen} bind:hiddenCalendarIds />

<Sheet bind:open={createOpen} title="Neuer Termin">
	{#snippet children()}
		<div class="p-4"><EventForm onsubmitted={() => (createOpen = false)} /></div>
	{/snippet}
</Sheet>

<!-- View-Umschalter und Navigation -->
<div class="mb-3 flex flex-wrap items-center gap-4">
	<div class="inline-flex rounded-xl bg-surface-1 p-1">
		{#each viewDefs as v (v.key)}
			<button onclick={() => setView(v.key)}
				class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {view === v.key ? 'bg-surface-0 text-text-primary shadow-sm' : 'text-text-secondary'}">
				{v.label}
			</button>
		{/each}
	</div>

	<div class="flex items-center gap-1">
		<button onclick={zurueck} class="flex h-10 w-10 items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-2 hover:text-text-primary" title="Zurück"><ChevronLeft size={18} /></button>
		<button onclick={heute} class="min-h-10 rounded-lg px-3 text-sm font-medium text-text-primary hover:bg-surface-2">
			Heute
		</button>
		<button onclick={vor} class="flex h-10 w-10 items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-2 hover:text-text-primary" title="Weiter"><ChevronRight size={18} /></button>
		<Input type="date" bind:value={sprungDatum} onchange={springe} class="ml-2 max-w-40 !py-1.5" />
	</div>
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
					{#if habit.schedule.type === 'weekly_count'}
						{@const wp = weekProgress(habit, habitsState.entriesFor(habit.id))}
						<div class="flex items-center gap-2">
							<span class="shrink-0 text-xs font-medium tabular-nums text-text-secondary">
								{wp.done}/{wp.target}
							</span>
							<div class="h-1.5 w-8 shrink-0 overflow-hidden rounded-full bg-surface-3">
								<div class="h-full {wp.done >= wp.target ? 'bg-emerald-500' : 'bg-primary-500'}"
									 style="width: {Math.min(100, (wp.done / Math.max(1, wp.target)) * 100)}%"></div>
							</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<section>
	{#if calendarState.loading}
		<div class="flex flex-col gap-2"><Skeleton height="4rem" /><Skeleton height="4rem" /><Skeleton height="4rem" /></div>
	{:else if view === 'agenda'}
		<div class="mb-3 flex gap-2">
			<Chip selected={agendaMode === 'future'} onclick={() => agendaMode = 'future'}>Ab heute</Chip>
			<Chip selected={agendaMode === 'all'} onclick={() => agendaMode = 'all'}>Alles</Chip>
		</div>
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
