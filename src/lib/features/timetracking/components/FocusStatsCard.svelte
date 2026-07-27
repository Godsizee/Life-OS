<script lang="ts">
	// W6 — eine Karte für Analytics UND Weekly Review: Woche/Heute, 7-Tage-Verlauf,
	// Top-Aufgaben. Liest ausschließlich aus Stores (nie direkt aus Supabase).
	import { timeTrackingState } from '../store.svelte';
	import { formatMinutes, minutesByDay, minutesByTask, startOfWeek } from '../stats';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { toISODate } from '$lib/core/date';
	import TrendChart from '$lib/features/fitness/components/TrendChart.svelte';
	import { Zap } from 'lucide-svelte';

	let { days = 7, title = 'Fokuszeit' }: { days?: number; title?: string } = $props();

	const points = $derived(
		minutesByDay(timeTrackingState.entries, days).map((p) => ({ label: p.label, value: p.value }))
	);
	const weekMinutes = $derived(timeTrackingState.totalWeekMin);
	const todayMinutes = $derived(timeTrackingState.totalTodayMin);
	const weekStart = $derived(toISODate(startOfWeek(new Date())));
	const topTasks = $derived(
		minutesByTask(
			timeTrackingState.entries,
			(id) => (id === null ? 'Ohne Aufgabe' : (tasksState.tasks.find((t) => t.id === id)?.title ?? 'Gelöschte Aufgabe')),
			weekStart,
			5
		)
	);
	const hasData = $derived(points.some((p) => p.value > 0));
</script>

<section class="glass-card rounded-2xl p-4 premium-shadow">
	<div class="mb-3 flex items-center justify-between gap-2">
		<h2 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
			<Zap size={14} class="text-yellow-500" /> {title}
		</h2>
		<a href="/focus" class="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400">
			Fokus starten
		</a>
	</div>

	<div class="flex flex-wrap items-baseline gap-x-6 gap-y-1">
		<div>
			<p class="text-2xl font-extrabold tabular-nums text-text-primary">{formatMinutes(weekMinutes)}</p>
			<p class="text-[11px] text-text-tertiary">diese Woche</p>
		</div>
		<div>
			<p class="text-lg font-bold tabular-nums text-text-secondary">{formatMinutes(todayMinutes)}</p>
			<p class="text-[11px] text-text-tertiary">heute</p>
		</div>
	</div>

	{#if hasData}
		<div class="mt-4">
			<TrendChart {points} formatValue={(v) => formatMinutes(v)} />
		</div>

		{#if topTasks.length > 0}
			<ul class="mt-4 flex flex-col gap-2 border-t border-border-color pt-3">
				{#each topTasks as row (row.key)}
					{@const pct = weekMinutes > 0 ? Math.round((row.minutes / weekMinutes) * 100) : 0}
					<li class="flex items-center gap-2">
						<span class="min-w-0 flex-1 truncate text-xs text-text-secondary">{row.title}</span>
						<div class="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-surface-3">
							<div class="h-full rounded-full bg-primary-600" style="width: {pct}%"></div>
						</div>
						<span class="w-16 shrink-0 text-right text-xs tabular-nums text-text-secondary">
							{formatMinutes(row.minutes)}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		<p class="mt-3 text-sm text-text-secondary">
			Noch keine Fokuszeit erfasst. Starte eine Runde oder trage Zeit nach.
		</p>
	{/if}
</section>
