<script lang="ts">
	import { goto } from '$app/navigation';
	import { Trash2, Link2, Dumbbell } from 'lucide-svelte';
	import type { Event } from '../types';
	import { calendarState } from '../store.svelte';
	import { formatRrule } from '../recurrence';
	import { linksState } from '$lib/features/links/store.svelte';
	import LinkedItems from '$lib/features/links/components/LinkedItems.svelte';

	let { event }: { event: Event } = $props();

	const timeLabel = $derived(
		event.all_day
			? 'Ganztägig'
			: `${new Date(event.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} – ${new Date(
					event.end
				).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
	);

	// Welle F4 — Kalender-Planung: verknüpfter Trainingsplan erlaubt „Workout starten" direkt aus dem Termin.
	const linkedPlanId = $derived(
		linksState
			.linksFor('event', event.id)
			.map((l) => (l.source_type === 'workout_plan' ? l.source_id : l.target_type === 'workout_plan' ? l.target_id : null))
			.find((id): id is string => id !== null) ?? null
	);

	let showLinks = $state(false);
</script>

<li class="flex flex-col gap-2 rounded-xl border border-border-color bg-surface-0 p-3">
	<div class="flex items-center gap-3">
		<div class="min-w-0 flex-1">
			<p class="truncate text-text-primary">{event.title}</p>
			<p class="truncate text-xs text-text-secondary">
				{timeLabel}{#if event.location}
					· {event.location}{/if}{#if event.rrule}
					· {formatRrule(event.rrule)}{/if}
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
			onclick={() => (showLinks = !showLinks)}
			aria-label="Verknüpfungen"
			aria-expanded={showLinks}
			class="shrink-0 text-text-tertiary hover:text-text-primary"
		>
			<Link2 size={16} />
		</button>
		<button
			onclick={() => calendarState.removeEvent(event.id)}
			aria-label="Löschen"
			class="shrink-0 text-text-tertiary active:text-red-600 dark:active:text-red-400"
		>
			<Trash2 size={18} />
		</button>
	</div>
	{#if showLinks}
		<div class="border-t border-border-color pt-2">
			<LinkedItems type="event" id={event.id} />
		</div>
	{/if}
</li>
