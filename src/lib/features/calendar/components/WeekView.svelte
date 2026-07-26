<script lang="ts">
	import { toISODate } from '$lib/core/date';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import type { Occurrence } from '../occurrences';

	let {
		occurrences,
		colorFor,
		anchor = $bindable(), // beliebiger Tag der angezeigten Woche
		activeDay = $bindable() // yyyy-mm-dd (mobile aktiver Tag)
	}: {
		occurrences: Occurrence[];
		colorFor: (calendarId: string) => string;
		anchor: Date;
		activeDay: string;
	} = $props();

	function startOfWeekMon(d: Date): Date {
		const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
		s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
		return s;
	}

	const days = $derived.by(() => {
		const s = startOfWeekMon(anchor);
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(s);
			d.setDate(s.getDate() + i);
			return d;
		});
	});

	const byDay = $derived.by(() => {
		const map = new Map<string, Occurrence[]>();
		for (const o of occurrences) {
			const key = toISODate(new Date(o.start));
			map.set(key, [...(map.get(key) ?? []), o]);
		}
		return map;
	});

	const todayKey = toISODate(new Date());
	const rangeLabel = $derived.by(() => {
		const s = days[0], e = days[6];
		return `${s.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} – ${e.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}`;
	});

	function shiftWeek(delta: number) {
		const n = new Date(anchor);
		n.setDate(n.getDate() + delta * 7);
		anchor = n;
	}
	function shiftDay(delta: number) {
		const d = new Date(activeDay);
		d.setDate(d.getDate() + delta);
		activeDay = toISODate(d);
		anchor = d;
	}

	function timeLabel(o: Occurrence): string {
		if (o.allDay) return 'Ganztägig';
		return new Date(o.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	}
</script>

<!-- Desktop: 7-Spalten-Woche -->
<div class="hidden lg:block">
	<div class="mb-3 flex items-center justify-between">
		<button onclick={() => shiftWeek(-1)} aria-label="Vorherige Woche" class="flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-2"><ChevronLeft size={20} /></button>
		<span class="text-sm font-bold text-text-primary">{rangeLabel}</span>
		<button onclick={() => shiftWeek(1)} aria-label="Nächste Woche" class="flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-2"><ChevronRight size={20} /></button>
	</div>
	<div class="grid grid-cols-7 gap-2">
		{#each days as day (day.toISOString())}
			{@const key = toISODate(day)}
			{@const items = byDay.get(key) ?? []}
			<div class="rounded-xl border border-border-color bg-surface-1 p-2">
				<div class="mb-2 text-center">
					<div class="text-[10px] uppercase text-text-tertiary">{day.toLocaleDateString('de-DE', { weekday: 'short' })}</div>
					<div class="text-sm {key === todayKey ? 'font-bold text-primary-600' : 'text-text-primary'}">{day.getDate()}</div>
				</div>
				<div class="flex flex-col gap-1">
					{#each items as o (o.key)}
						<div class="rounded-lg px-2 py-1 text-xs text-white" style="background-color: {colorFor(o.event.calendar_id)}">
							<div class="font-medium leading-tight">{timeLabel(o)}</div>
							<div class="truncate leading-tight">{o.title}</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Mobile: vertikale Tagesansicht -->
<div class="lg:hidden">
	<div class="mb-3 flex items-center justify-between">
		<button onclick={() => shiftDay(-1)} aria-label="Vorheriger Tag" class="flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-2"><ChevronLeft size={20} /></button>
		<span class="text-sm font-bold text-text-primary">{new Date(activeDay).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span>
		<button onclick={() => shiftDay(1)} aria-label="Nächster Tag" class="flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-2"><ChevronRight size={20} /></button>
	</div>
	{#if (byDay.get(activeDay) ?? []).length === 0}
		<p class="py-8 text-center text-sm text-text-tertiary">Keine Termine an diesem Tag</p>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each byDay.get(activeDay) ?? [] as o (o.key)}
				<li class="flex items-center gap-3 rounded-xl border border-border-color bg-surface-0 p-3">
					<span class="h-8 w-1 shrink-0 rounded-full" style="background-color: {colorFor(o.event.calendar_id)}"></span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-text-primary">{o.title}</p>
						<p class="truncate text-xs text-text-secondary">{timeLabel(o)}{#if o.location} · {o.location}{/if}</p>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
