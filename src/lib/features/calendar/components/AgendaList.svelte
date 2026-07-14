<script lang="ts">
	import { goto } from '$app/navigation';
	import { Trash2, CheckCircle2, Circle, Link2, Dumbbell } from 'lucide-svelte';
	import { calendarState } from '../store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { formatRrule } from '../recurrence';
	import { toastState } from '$lib/core/toast.svelte';
	import { linksState } from '$lib/features/links/store.svelte';
	import LinkedItems from '$lib/features/links/components/LinkedItems.svelte';

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
		type: 'event' | 'task';
		title: string;
		start: string;
		end: string;
		allDay?: boolean;
		location?: string | null;
		rrule?: string | null;
		status?: 'todo' | 'doing' | 'done';
		priority?: 'high' | 'medium' | 'low';
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
						{@const linkedPlanId = linkedPlanIdFor(item.id)}
						<li class="flex flex-col gap-2 rounded-xl border border-border-color bg-surface-0 p-3 shadow-sm transition-colors duration-200">
							<div class="flex items-center gap-3">
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-text-primary">{item.title}</p>
									<p class="truncate text-xs text-text-secondary">
										{timeLabel}{#if item.location} · {item.location}{/if}{#if item.rrule} · {formatRrule(item.rrule)}{/if}
									</p>
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
									onclick={() => {
										calendarState.removeEvent(item.id);
										toastState.success('Termin gelöscht');
									}}
									aria-label="Termin löschen"
									class="shrink-0 text-text-tertiary hover:text-red-500 active:scale-95 transition-all"
								>
									<Trash2 size={16} />
								</button>
							</div>
							{#if expandedEventId === item.id}
								<div class="border-t border-border-color pt-2">
									<LinkedItems type="event" id={item.id} />
								</div>
							{/if}
						</li>
					{:else}
						{@const isCompleted = item.status === 'done'}
						<li class="flex items-center gap-3 rounded-xl border border-border-color bg-surface-0 p-3 shadow-sm transition-colors duration-200">
							<button
								onclick={() => {
									tasksState.setStatus(item.id, isCompleted ? 'todo' : 'done');
									toastState.success(isCompleted ? 'Aufgabe als offen markiert' : 'Aufgabe erledigt ✓');
								}}
								class="shrink-0 text-text-tertiary hover:text-emerald-500 active:scale-90 transition-all"
								aria-label={isCompleted ? 'Als offen markieren' : 'Als erledigt markieren'}
							>
								{#if isCompleted}
									<CheckCircle2 size={18} class="text-emerald-500" />
								{:else}
									<Circle size={18} />
								{/if}
							</button>

							<div class="min-w-0 flex-1">
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
							</div>
							<button
								onclick={() => {
									tasksState.removeTask(item.id);
									toastState.success('Aufgabe gelöscht');
								}}
								aria-label="Aufgabe löschen"
								class="shrink-0 text-text-tertiary hover:text-red-500 active:scale-95 transition-all"
							>
								<Trash2 size={16} />
							</button>
						</li>
					{/if}
				{/each}
			</ul>
		</div>
	{:else}
		<p class="text-sm text-text-secondary">Keine Termine oder Aufgabenfälligkeiten.</p>
	{/each}
</div>
