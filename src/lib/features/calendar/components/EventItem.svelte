<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { Event } from '../types';
	import { calendarState } from '../store.svelte';
	import { formatRrule } from '../recurrence';

	let { event }: { event: Event } = $props();

	const timeLabel = $derived(
		event.all_day
			? 'Ganztägig'
			: `${new Date(event.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} – ${new Date(
					event.end
				).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
	);
</script>

<li class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
	<div class="min-w-0 flex-1">
		<p class="truncate text-slate-900">{event.title}</p>
		<p class="truncate text-xs text-slate-500">
			{timeLabel}{#if event.location}
				· {event.location}{/if}{#if event.rrule}
				· {formatRrule(event.rrule)}{/if}
		</p>
	</div>
	<button
		onclick={() => calendarState.removeEvent(event.id)}
		aria-label="Löschen"
		class="shrink-0 text-slate-400 active:text-red-600"
	>
		<Trash2 size={18} />
	</button>
</li>
