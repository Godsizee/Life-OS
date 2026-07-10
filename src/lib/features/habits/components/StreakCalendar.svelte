<script lang="ts">
	import { toISODate } from '$lib/core/date';
	import { isDueOn } from '$lib/features/habits/streak';
	import type { Habit, HabitSchedule } from '$lib/features/habits/types';
	import { themeState } from '$lib/core/theme.svelte';

	let {
		habits,
		logsFor
	}: {
		habits: Habit[];
		logsFor: (habitId: string) => string[];
	} = $props();

	// ── Datums-Grid (12 Wochen = 84 Tage rückwärts) ──────────────────
	const WEEKS = 12;
	const DAYS = WEEKS * 7;

	const today = new Date();
	// Starte am ersten Tag des Grid (84 Tage zurück, dann ausrichten auf Montag)
	const gridStart = new Date(today);
	gridStart.setDate(today.getDate() - DAYS + 1);

	// Alle Tage als ISO-Strings
	const allDays: string[] = Array.from({ length: DAYS }, (_, i) => {
		const d = new Date(gridStart);
		d.setDate(gridStart.getDate() + i);
		return toISODate(d);
	});

	// Tage nach Wochen gruppieren (je 7 Tage = 1 Spalte im Grid)
	const weeks: string[][] = [];
	for (let w = 0; w < WEEKS; w++) {
		weeks.push(allDays.slice(w * 7, w * 7 + 7));
	}

	// ── Heatmap-Daten berechnen ────────────────────────────────────────
	// Pro Tag: wie viele Habits waren fällig und wie viele davon geloggt
	interface DayData {
		date: string;
		due: number;
		logged: number;
		pct: number; // 0–100
	}

	const dayData = $derived(
		allDays.reduce<Record<string, DayData>>((acc, dateStr) => {
			const dateObj = new Date(dateStr);
			let due = 0;
			let logged = 0;
			for (const h of habits) {
				if (isDueOn(h.schedule as HabitSchedule, dateObj)) {
					due++;
					if (logsFor(h.id).includes(dateStr)) logged++;
				}
			}
			acc[dateStr] = { date: dateStr, due, logged, pct: due > 0 ? Math.round((logged / due) * 100) : -1 };
			return acc;
		}, {})
	);

	// ── Farb-Mapping ──────────────────────────────────────────────────
	function cellColor(data: DayData): string {
		const isDark = themeState.isDark;
		if (data.pct < 0) return isDark ? '#1e113a' : '#f1f5f9'; // kein Habit fällig → neutral
		if (data.pct === 0) return isDark ? '#4c1d24' : '#fee2e2'; // 0% → rot-hint
		if (data.pct < 50) return isDark ? '#064e3b' : '#bbf7d0'; // < 50% → schwaches grün
		if (data.pct < 80) return isDark ? '#047857' : '#4ade80'; // < 80% → mittleres grün
		return isDark ? '#10b981' : '#059669'; // 80%+ → sattes emerald
	}

	const legendColors = $derived(
		themeState.isDark
			? ['#1e113a', '#4c1d24', '#064e3b', '#047857', '#10b981']
			: ['#f1f5f9', '#fee2e2', '#bbf7d0', '#4ade80', '#059669']
	);

	// ── Monats-Label (erste Woche des Monats) ────────────────────────
	const monthLabels: { week: number; label: string }[] = [];
	for (let w = 0; w < weeks.length; w++) {
		const firstDay = new Date(weeks[w][0]);
		if (firstDay.getDate() <= 7 || w === 0) {
			monthLabels.push({
				week: w,
				label: firstDay.toLocaleDateString('de-DE', { month: 'short' })
			});
		}
	}

	// ── Tooltip-State ─────────────────────────────────────────────────
	let tooltip = $state<{ date: string; logged: number; due: number } | null>(null);

	const CELL_SIZE = 11;
	const CELL_GAP = 2;
	const STEP = CELL_SIZE + CELL_GAP;
	const LABEL_HEIGHT = 16;
	const svgWidth = WEEKS * STEP;
	const svgHeight = LABEL_HEIGHT + 7 * STEP;
</script>

<div class="w-full overflow-x-auto">
	<svg
		width={svgWidth}
		height={svgHeight}
		viewBox="0 0 {svgWidth} {svgHeight}"
		aria-label="Habit-Heatmap der letzten 12 Wochen"
	>
		<!-- Monats-Labels -->
		{#each monthLabels as { week, label }}
			<text
				x={week * STEP}
				y={LABEL_HEIGHT - 3}
				font-size="9"
				fill="currentColor"
				class="text-text-tertiary"
				font-family="system-ui, sans-serif"
			>{label}</text>
		{/each}

		<!-- Zellen -->
		{#each weeks as week, wi}
			{#each week as dateStr, di}
				{@const data = dayData[dateStr]}
				{@const isToday = dateStr === toISODate(today)}
				<rect
					x={wi * STEP}
					y={LABEL_HEIGHT + di * STEP}
					width={CELL_SIZE}
					height={CELL_SIZE}
					rx="2"
					ry="2"
					fill={cellColor(data)}
					stroke={isToday ? '#059669' : 'none'}
					stroke-width={isToday ? 1.5 : 0}
					class="cursor-pointer transition-opacity hover:opacity-80"
					onmouseenter={() => (tooltip = data)}
					onmouseleave={() => (tooltip = null)}
					role="gridcell"
					aria-label="{dateStr}: {data.logged}/{data.due} Habits"
				/>
			{/each}
		{/each}
	</svg>

	<!-- Tooltip -->
	{#if tooltip}
		<div class="mt-1 text-xs text-text-secondary">
			<span class="font-medium">{new Date(tooltip.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
			{#if tooltip.due > 0}
				— {tooltip.logged}/{tooltip.due} Habits
				({tooltip.logged > 0 ? Math.round((tooltip.logged / tooltip.due) * 100) : 0}%)
			{:else}
				— kein Habit fällig
			{/if}
		</div>
	{/if}

	<!-- Legende -->
	<div class="mt-2 flex items-center gap-2 text-[10px] text-text-tertiary">
		<span>Weniger</span>
		{#each legendColors as color}
			<span
				class="inline-block h-2.5 w-2.5 rounded-sm"
				style="background:{color}"
			></span>
		{/each}
		<span>Mehr</span>
	</div>
</div>
