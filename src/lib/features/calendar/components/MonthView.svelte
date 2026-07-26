<script lang="ts">
	import { toISODate } from '$lib/core/date';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type { Occurrence } from '../occurrences';

	let {
		occurrences,
		colorFor,
		selected = $bindable(),
		month = $bindable()
	}: {
		occurrences: Occurrence[];
		colorFor: (calendarId: string) => string;
		selected: string; // yyyy-mm-dd
		month: Date; // beliebiger Tag im angezeigten Monat
	} = $props();

	const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

	const grid = $derived.by(() => {
		const first = new Date(month.getFullYear(), month.getMonth(), 1);
		const lead = (first.getDay() + 6) % 7; // Mo=0
		const startCell = new Date(first);
		startCell.setDate(first.getDate() - lead);
		return Array.from({ length: 42 }, (_, i) => {
			const d = new Date(startCell);
			d.setDate(startCell.getDate() + i);
			return d;
		});
	});

	// Occurrences pro Tag (yyyy-mm-dd) → Marker-Farben (max 4).
	const dotsByDay = $derived.by(() => {
		const map = new Map<string, string[]>();
		for (const o of occurrences) {
			const key = toISODate(new Date(o.start));
			const arr = map.get(key) ?? [];
			if (arr.length < 4) arr.push(colorFor(o.event.calendar_id));
			map.set(key, arr);
		}
		return map;
	});

	const todayKey = toISODate(new Date());
	const monthLabel = $derived(month.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }));

	function shift(delta: number) {
		month = new Date(month.getFullYear(), month.getMonth() + delta, 1);
	}
	function goToday() {
		const now = new Date();
		month = new Date(now.getFullYear(), now.getMonth(), 1);
		selected = toISODate(now);
	}
</script>

<div class="mb-3 flex items-center justify-between">
	<button onclick={() => shift(-1)} aria-label="Vorheriger Monat"
		class="flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-2">
		<ChevronLeft size={20} />
	</button>
	<div class="flex items-center gap-2">
		<span class="text-sm font-bold text-text-primary">{monthLabel}</span>
		<button onclick={goToday} class="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-text-primary">
			Heute
		</button>
	</div>
	<button onclick={() => shift(1)} aria-label="Nächster Monat"
		class="flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-2">
		<ChevronRight size={20} />
	</button>
</div>

<div class="grid grid-cols-7 gap-1">
	{#each WEEKDAYS as wd (wd)}
		<div class="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-text-tertiary">{wd}</div>
	{/each}
	{#each grid as day (day.toISOString())}
		{@const key = toISODate(day)}
		{@const inMonth = day.getMonth() === month.getMonth()}
		{@const dots = dotsByDay.get(key) ?? []}
		<button
			onclick={() => (selected = key)}
			class="flex aspect-square min-h-12 flex-col items-center justify-start gap-1 rounded-xl border p-1 transition-colors
				{selected === key ? 'border-primary-500 bg-primary-500/10' : 'border-transparent hover:bg-surface-2'}"
		>
			<span class="text-xs {inMonth ? 'text-text-primary' : 'text-text-tertiary'} {key === todayKey ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 font-bold text-white' : ''}">
				{day.getDate()}
			</span>
			<span class="flex flex-wrap justify-center gap-0.5">
				{#each dots as c, i (i)}
					<span class="h-1.5 w-1.5 rounded-full" style="background-color: {c}"></span>
				{/each}
			</span>
		</button>
	{/each}
</div>
