<script lang="ts">
	import { goto } from '$app/navigation';
	import { Trash2, CheckCircle2, Circle, Link2, Dumbbell, Calendar, Pencil } from 'lucide-svelte';
	import { calendarState } from '../store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { formatRrule } from '../recurrence';
	import { toastState } from '$lib/core/toast.svelte';
	import { linksState } from '$lib/features/links/store.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import LinkedItems from '$lib/features/links/components/LinkedItems.svelte';
	import ListRow from '$lib/ui/ListRow.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Button from '$lib/ui/Button.svelte';
	import EventForm from './EventForm.svelte';
	import { fade } from 'svelte/transition';
	import { DURATION, motionDuration } from '$lib/ui/motion';

	function linkedPlanIdFor(eventId: string): string | null {
		return (
			linksState
				.linksFor('event', eventId)
				.map((l) =>
					l.source_type === 'workout_plan' ? l.source_id : l.target_type === 'workout_plan' ? l.target_id : null
				)
				.find((id): id is string => id !== null) ?? null
		);
	}

	let expandedEventId = $state<string | null>(null);

	export interface AgendaItem {
		id: string;
		sourceId: string;
		type: 'event' | 'task';
		title: string;
		start: string;
		end: string;
		allDay?: boolean;
		location?: string | null;
		rrule?: string | null;
		status?: 'todo' | 'doing' | 'done';
		priority?: 'high' | 'medium' | 'low';
		occurrenceDate?: string;
	}

	let { items }: { items: AgendaItem[] } = $props();

	const groups = $derived.by(() => {
		const sorted = [...items].sort((a, b) => a.start.localeCompare(b.start));
		const map = new Map<string, AgendaItem[]>();
		for (const item of sorted) {
			const key = new Date(item.start).toLocaleDateString('de-DE', {
				weekday: 'short',
				day: '2-digit',
				month: '2-digit'
			});
			map.set(key, [...(map.get(key) ?? []), item]);
		}
		return [...map.entries()];
	});

	const priorityColors = {
		high: 'text-red-500 bg-red-500/10 border-red-500/20 dark:bg-red-950/20 dark:border-red-900/30',
		medium: 'text-blue-500 bg-blue-500/10 border-blue-500/20 dark:bg-blue-950/20 dark:border-blue-900/30',
		low: 'text-slate-500 bg-slate-500/10 border-slate-500/20 dark:bg-slate-950/20 dark:border-slate-900/30'
	};

	let deleteTarget = $state<AgendaItem | null>(null);
	let editPromptTarget = $state<AgendaItem | null>(null);
	let editFormTarget = $state<AgendaItem | null>(null);
	let editOccurrenceDate = $state<string | undefined>(undefined);

	function requestDelete(item: AgendaItem) {
		if (item.type === 'event' && item.rrule && item.occurrenceDate) {
			deleteTarget = item;
		} else {
			if (item.type === 'event') {
				calendarState.removeEvent(item.sourceId);
				toastState.success('Termin gelöscht');
			} else {
				tasksState.removeTask(item.sourceId);
				toastState.success('Aufgabe gelöscht');
			}
		}
	}
	function deleteThisOne() {
		if (deleteTarget?.occurrenceDate) {
			calendarState.cancelOccurrence(deleteTarget.sourceId, deleteTarget.occurrenceDate);
			toastState.success('Dieser Termin gelöscht');
		}
		deleteTarget = null;
	}
	function deleteSeries() {
		if (deleteTarget) {
			calendarState.removeEvent(deleteTarget.sourceId);
			toastState.success('Serie gelöscht');
		}
		deleteTarget = null;
	}

	function requestEdit(item: AgendaItem) {
		if (item.rrule && item.occurrenceDate) {
			editPromptTarget = item;
		} else {
			editOccurrenceDate = undefined;
			editFormTarget = item;
		}
	}
	function editThisOne() {
		if (editPromptTarget?.occurrenceDate) {
			editOccurrenceDate = editPromptTarget.occurrenceDate;
			editFormTarget = editPromptTarget;
		}
		editPromptTarget = null;
	}
	function editSeries() {
		if (editPromptTarget) {
			editOccurrenceDate = undefined;
			editFormTarget = editPromptTarget;
		}
		editPromptTarget = null;
	}

	function getAttendees(sourceId: string) {
		const ev = calendarState.events.find(e => e.id === sourceId);
		if (!ev?.attendee_ids) return [];
		return ev.attendee_ids.map(id => workspaceState.members.find(m => m.user_id === id)).filter(Boolean);
	}
</script>

<div class="flex flex-col gap-4">
	{#each groups as [day, dayItems] (day)}
		<div>
			<h3 class="mb-2 text-xs font-bold tracking-wide text-text-tertiary uppercase">{day}</h3>
			<ul class="flex flex-col gap-2">
				{#each dayItems as item (item.id)}
					{#if item.type === 'event'}
						{@const timeLabel = item.allDay
							? 'Ganztägig'
							: `${new Date(item.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} – ${new Date(
									item.end
								).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
						{@const linkedPlanId = linkedPlanIdFor(item.sourceId)}
						{@const attendees = getAttendees(item.sourceId)}
						<li class="contents" transition:fade={{ duration: motionDuration(DURATION.fast) }}>
						<ListRow align="start" class="shadow-sm">
							<div class="flex w-full items-center gap-3">
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-text-primary">{item.title}</p>
									<p class="truncate text-xs text-text-secondary">
										{timeLabel}{#if item.location} · {item.location}{/if}{#if item.rrule} · {formatRrule(item.rrule)}{/if}
									</p>
									{#if attendees.length > 0}
										<div class="mt-1 flex gap-1">
											{#each attendees.slice(0, 3) as att}
												<div class="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold text-text-secondary" title={att?.profile?.display_name ?? '?'}>
													{(att?.profile?.display_name ?? '?').charAt(0).toUpperCase()}
												</div>
											{/each}
											{#if attendees.length > 3}
												<div class="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold text-text-secondary">
													+{attendees.length - 3}
												</div>
											{/if}
										</div>
									{/if}
								</div>
								{#if linkedPlanId}
									<button
										onclick={() => goto(`/fitness?startPlan=${linkedPlanId}`)}
										class="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary-700 px-2 py-1 text-xs font-bold text-white hover:bg-primary-800"
									>
										<Dumbbell size={12} /> Start
									</button>
								{/if}
								<button
									onclick={() => (expandedEventId = expandedEventId === item.id ? null : item.id)}
									aria-label="Verknüpfungen"
									aria-expanded={expandedEventId === item.id}
									class="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
								>
									<Link2 size={16} />
								</button>
								<button
									onclick={() => requestEdit(item)}
									aria-label="Termin bearbeiten"
									class="shrink-0 text-text-tertiary hover:text-primary-500 active:scale-95 transition-all"
								>
									<Pencil size={16} />
								</button>
								<button
									onclick={() => requestDelete(item)}
									aria-label="Termin löschen"
									class="shrink-0 text-text-tertiary hover:text-red-500 active:scale-95 transition-all"
								>
									<Trash2 size={16} />
								</button>
							</div>
							{#if expandedEventId === item.id}
								<div class="w-full border-t border-border-color pt-2">
									<LinkedItems type="event" id={item.sourceId} />
								</div>
							{/if}
						</ListRow>
						</li>
					{:else}
						{@const isCompleted = item.status === 'done'}
						<li class="contents" transition:fade={{ duration: motionDuration(DURATION.fast) }}>
						<ListRow class="shadow-sm">
							{#snippet leading()}
								<button
									onclick={() => {
										tasksState.setStatus(item.sourceId, isCompleted ? 'todo' : 'done');
										toastState.success(isCompleted ? 'Aufgabe als offen markiert' : 'Aufgabe erledigt ✓');
									}}
									class="shrink-0 text-text-tertiary hover:text-primary-500 active:scale-90 transition-all"
									aria-label={isCompleted ? 'Als offen markieren' : 'Als erledigt markieren'}
								>
									{#if isCompleted}
										<CheckCircle2 size={18} class="text-primary-500" />
									{:else}
										<Circle size={18} />
									{/if}
								</button>
							{/snippet}
							<p class="truncate text-sm font-medium text-text-primary {isCompleted ? 'line-through text-text-tertiary' : ''}">
								{item.title}
							</p>
							<p class="truncate text-[10px] text-text-secondary flex items-center gap-1.5 mt-0.5">
								<span>Fällig: {new Date(item.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
								{#if item.priority}
									<span class="rounded-full border px-1.5 py-0.2 font-semibold uppercase tracking-wider {priorityColors[item.priority]}">
										{item.priority === 'high' ? 'Prio 1' : item.priority === 'medium' ? 'Prio 2' : 'Prio 3'}
									</span>
								{/if}
							</p>
							{#snippet trailing()}
								<button
									onclick={() => requestDelete(item)}
									aria-label="Aufgabe löschen"
									class="shrink-0 text-text-tertiary hover:text-red-500 active:scale-95 transition-all"
								>
									<Trash2 size={16} />
								</button>
							{/snippet}
						</ListRow>
						</li>
					{/if}
				{/each}
			</ul>
		</div>
	{:else}
		<EmptyState icon={Calendar} title="Keine Termine oder Aufgabenfälligkeiten" />
	{/each}
</div>

<Sheet bind:open={() => deleteTarget !== null, (v) => { if (!v) deleteTarget = null; }} title="Wiederkehrender Termin löschen">
	{#snippet children()}
		<div class="flex flex-col gap-2 p-4">
			<p class="text-sm text-text-secondary mb-2">Möchtest du nur diesen Termin oder die ganze Serie löschen?</p>
			<Button variant="secondary" onclick={deleteThisOne}>
				{#snippet children()}Nur diesen Termin{/snippet}
			</Button>
			<Button variant="danger" onclick={deleteSeries}>
				{#snippet children()}Ganze Serie{/snippet}
			</Button>
		</div>
	{/snippet}
</Sheet>

<Sheet bind:open={() => editPromptTarget !== null, (v) => { if (!v) editPromptTarget = null; }} title="Wiederkehrender Termin bearbeiten">
	{#snippet children()}
		<div class="flex flex-col gap-2 p-4">
			<p class="text-sm text-text-secondary mb-2">Möchtest du nur diesen Termin oder die ganze Serie bearbeiten?</p>
			<Button variant="secondary" onclick={editThisOne}>
				{#snippet children()}Nur diesen Termin{/snippet}
			</Button>
			<Button variant="primary" onclick={editSeries}>
				{#snippet children()}Ganze Serie{/snippet}
			</Button>
		</div>
	{/snippet}
</Sheet>

<Sheet bind:open={() => editFormTarget !== null, (v) => { if (!v) editFormTarget = null; }} title="Termin bearbeiten">
	{#snippet children()}
		<div class="p-4">
			{#if editFormTarget}
				<EventForm 
					onsubmitted={() => (editFormTarget = null)} 
					event={calendarState.events.find(e => e.id === editFormTarget!.sourceId)} 
					occurrenceDate={editOccurrenceDate} 
				/>
			{/if}
		</div>
	{/snippet}
</Sheet>
