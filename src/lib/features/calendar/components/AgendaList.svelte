<script lang="ts">
	import EventItem from './EventItem.svelte';
	import type { Event } from '../types';

	let { events }: { events: Event[] } = $props();

	const groups = $derived.by(() => {
		const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
		const map = new Map<string, Event[]>();
		for (const event of sorted) {
			const key = new Date(event.start).toLocaleDateString('de-DE', {
				weekday: 'short',
				day: '2-digit',
				month: '2-digit'
			});
			map.set(key, [...(map.get(key) ?? []), event]);
		}
		return [...map.entries()];
	});
</script>

<div class="flex flex-col gap-4">
	{#each groups as [day, dayEvents] (day)}
		<div>
			<h3 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{day}</h3>
			<ul class="flex flex-col gap-2">
				{#each dayEvents as event (event.id)}
					<EventItem {event} />
				{/each}
			</ul>
		</div>
	{:else}
		<p class="text-sm text-slate-500">Keine Termine.</p>
	{/each}
</div>
