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

<li class="flex items-center gap-3 rounded-xl border border-border-color bg-surface-0 p-3">
	<div class="min-w-0 flex-1">
		<p class="truncate text-text-primary">{event.title}</p>
		<p class="truncate text-xs text-text-secondary">
			{timeLabel}{#if event.location}
				· {event.location}{/if}{#if event.rrule}
				· {formatRrule(event.rrule)}{/if}
		</p>
	</div>
	<button
		onclick={() => calendarState.removeEvent(event.id)}
		aria-label="Löschen"
		class="shrink-0 text-text-tertiary active:text-red-600 dark:active:text-red-400"
	>
		<Trash2 size={18} />
	</button>
</li>
