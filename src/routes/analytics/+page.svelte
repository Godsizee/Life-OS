<script lang="ts">
	import ModulIntro from '#lib/system/components/ModulIntro.svelte';
	import { analyticsState } from '#lib/features/analytics/store.svelte.js';
	import { moodState } from '#lib/features/mood/store.svelte.js';
	import { fitnessState } from '#lib/features/fitness/store.svelte.js';
	import ScoreRing from '#lib/features/analytics/components/ScoreRing.svelte';
	import WeekSparkline from '#lib/features/analytics/components/WeekSparkline.svelte';
	import MoodHealthCorrelation from '#lib/features/analytics/components/MoodHealthCorrelation.svelte';
	import MoodActivityStats from '#lib/features/mood/components/MoodActivityStats.svelte';
	import { filterSince } from '#lib/features/mood/stats.js';
	import FocusStatsCard from '#lib/features/timetracking/components/FocusStatsCard.svelte';
	import MonthlyReport from '#lib/features/analytics/components/MonthlyReport.svelte';
	import PageHeader from '#lib/ui/PageHeader.svelte';
	import {
		Activity,
		Target,
		Repeat,
		Heart,
		SmilePlus,
		BookOpen,
		Zap,
		Dumbbell,
		TrendingUp,
		TrendingDown,
		Minus,
		Download
	} from '@lucide/svelte';
	import { APP_LOCALE } from '#lib/core/locale.js';
	import { toISODate } from '#lib/core/date.js';
	import type { ModulId } from '#lib/config/modules.js';
	import { scoreSeries } from '#lib/features/analytics/score-math.js';
	import { toCsv } from '#lib/features/analytics/report.js';

	let zeitraum = $state<30 | 90 | 365>(30);
	let showAllHistory = $state(false);

	$effect(() => {
		if (fitnessState.loaded) void fitnessState.loadAllSetLogs();
	});

	const series = $derived(scoreSeries(analyticsState.scores, zeitraum));
	const averageScore = $derived(
		series.filter((s) => s.total !== null).length > 0
			? Math.round(
					series.filter((s) => s.total !== null).reduce((a, b) => a + (b.total ?? 0), 0) /
						series.filter((s) => s.total !== null).length
				)
			: 0
	);

	const historyList = $derived(
		showAllHistory
			? analyticsState.scores.slice().reverse()
			: analyticsState.scores.slice().reverse().slice(0, 30)
	);

	const moodStatsEntries = $derived(filterSince(moodState.entries, zeitraum));

	// Heutige Zeilen nach den aktuellen Gewichten und Modulen; jede trägt ihre Erklärung.
	const zeilen = $derived(analyticsState.todayErgebnis?.zeilen ?? []);

	const yesterdayStr = $derived.by(() => {
		const d = new Date();
		d.setDate(d.getDate() - 1);
		return toISODate(d);
	});

	const yesterdayBreakdown = $derived.by(() => {
		const entry = analyticsState.scores.find((s) => s.date === yesterdayStr);
		return entry?.breakdown ?? null;
	});

	function trend(key: ModulId, today: number | null): 'up' | 'down' | 'flat' {
		const yb = yesterdayBreakdown;
		const yesterday = yb ? yb[key] : null;
		if (today === null || typeof yesterday !== 'number') return 'flat';
		if (today > yesterday + 3) return 'up';
		if (today < yesterday - 3) return 'down';
		return 'flat';
	}

	type Stil = { icon: typeof Target; color: string; bg: string };
	const KATEGORIE_STIL: Partial<Record<ModulId, Stil>> = {
		tasks: { icon: Target, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
		habits: { icon: Repeat, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/20' },
		health: { icon: Heart, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/20' },
		fitness: { icon: Dumbbell, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
		goals: { icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
		journal: { icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
		mood: { icon: SmilePlus, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
		focus: { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/20' }
	};

	const STANDARD_STIL: Stil = {
		icon: Activity,
		color: 'text-slate-500',
		bg: 'bg-slate-50 dark:bg-slate-950/20'
	};

	const categories = $derived(
		zeilen
			.slice()
			.sort((a, b) => b.gewicht - a.gewicht)
			.map((z) => ({
				key: z.modul,
				name: z.label,
				wert: z.wert,
				erklaerung: z.erklaerung,
				weight: z.anteil > 0 ? `${Math.round(z.anteil * 100)} %` : 'zählt nicht',
				...(KATEGORIE_STIL[z.modul] ?? STANDARD_STIL)
			}))
	);

	function exportCsv() {
		const csvStr = toCsv(analyticsState.scores);
		const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `life_score_export_${toISODate(new Date())}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
</script>

<svelte:head>
	<title>Analytics - Life Score Detail</title>
</svelte:head>

{#snippet zeitraumToggle()}
	<div class="flex items-center gap-1 rounded-xl bg-surface-2 p-1">
		{#each [30, 90, 365] as z}
			<button
				onclick={() => {
					zeitraum = z as any;
				}}
				class="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-xs font-bold transition-all md:flex-none md:px-3 {zeitraum ===
				z
					? 'premium-shadow bg-surface-0 text-primary-active'
					: 'text-text-secondary hover:text-text-primary'}"
			>
				{z} T.
			</button>
		{/each}
	</div>
{/snippet}

<div class="space-y-6">
	<!-- Header. Der Zeitraum-Umschalter ist ~184px breit und liesse neben Titel und
	     Untertitel auf schmalen Displays keine brauchbare Spalte uebrig - darunter
	     steht er deshalb als eigene Zeile. -->
	<PageHeader
		title="Life Score"
		subtitle="Analysiere dein tägliches Wohlbefinden und Produktivität."
	>
		{#snippet trailing()}
			<div class="hidden md:block">
				{@render zeitraumToggle()}
			</div>
		{/snippet}
	</PageHeader>

	<ModulIntro modul="analytics" />

	<div class="md:hidden">
		{@render zeitraumToggle()}
	</div>

	<!-- Core Dashboard -->
	<div class="grid gap-6 md:grid-cols-3">
		<!-- Ring / Score Card -->
		<div
			class="glass-card premium-shadow flex flex-col items-center justify-center rounded-2xl p-6 text-center"
		>
			<ScoreRing score={analyticsState.todayScore} size={140} />
			<div class="mt-4">
				<h3 class="text-base font-bold text-text-primary">Heutiger Life Score</h3>
				<p class="mt-1 text-xs text-text-secondary">
					Dein aktueller Tages-Score basierend auf deinen Daten.
				</p>
			</div>
		</div>

		<!-- Trend Sparkline -->
		<div
			class="glass-card premium-shadow flex flex-col justify-between rounded-2xl p-6 md:col-span-2"
		>
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-bold tracking-wider text-text-tertiary uppercase">
						Score-Verlauf
					</h3>
					<span class="text-3xl font-extrabold text-text-primary tabular-nums">{averageScore}</span>
					<span class="ml-1 text-xs text-text-secondary">Ø-Score</span>
				</div>
			</div>

			<div class="my-4 flex justify-center py-2">
				<WeekSparkline scores={series} />
			</div>

			<div class="border-t border-border-color pt-3 text-[11px] text-text-tertiary">
				Je beständiger du trackst, desto präziser ist dein durchschnittlicher Score.
			</div>
		</div>
	</div>

	<!-- Breakdown Details -->
	<section class="space-y-3">
		<h2 class="text-xs font-bold tracking-wider text-text-tertiary uppercase">
			Heutige Aufschlüsselung
		</h2>
		<div class="grid gap-4 md:grid-cols-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each categories as cat (cat.key)}
				{@const Icon = cat.icon}
				{@const val = cat.wert === null ? null : Math.round(cat.wert)}
				{@const t = trend(cat.key, cat.wert)}
				<div class="glass-card premium-shadow flex items-center justify-between rounded-2xl p-4">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl {cat.bg} {cat.color}">
							<Icon size={18} />
						</div>
						<div>
							<div class="flex items-center gap-1">
								<h4 class="text-xs font-bold text-text-secondary">{cat.name}</h4>
								<span class="text-[10px] text-text-tertiary">({cat.weight})</span>
							</div>
							<div class="flex items-center gap-1">
								<span class="text-lg font-extrabold text-text-primary tabular-nums"
									>{val === null ? '–' : `${val}%`}</span
								>
								{#if t === 'up'}
									<TrendingUp size={13} class="text-primary-500" />
								{:else if t === 'down'}
									<TrendingDown size={13} class="text-red-500" />
								{:else}
									<Minus size={13} class="text-text-faint" />
								{/if}
							</div>
							<p class="mt-0.5 max-w-44 text-[10px] leading-snug text-text-tertiary">
								{cat.erklaerung}
							</p>
						</div>
					</div>

					<!-- Progress mini bar -->
					<div class="h-10 w-1 overflow-hidden rounded-full bg-surface-3">
						<div
							class="w-full rounded-full bg-primary-600 transition-all duration-1000"
							style="height: {val ?? 0}%"
						></div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Fokus-Auswertung -->
	<FocusStatsCard />

	<!-- Monatsbericht -->
	<MonthlyReport days={zeitraum} />

	<!-- Aktivitäts-Statistik -->
	<section class="space-y-3">
		<h2 class="text-xs font-bold tracking-wider text-text-tertiary uppercase">
			Stimmung ↔ Aktivitäten ({zeitraum} Tage)
		</h2>
		<MoodActivityStats entries={moodStatsEntries} />
	</section>

	<!-- Mood ↔ Health Korrelation -->
	<MoodHealthCorrelation />

	<!-- History Feed -->
	{#if analyticsState.scores.length > 0}
		<section class="space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="text-xs font-bold tracking-wider text-text-tertiary uppercase">Verlauf</h2>
				<button
					onclick={exportCsv}
					class="flex items-center gap-1 text-xs font-bold text-primary-active hover:text-primary-600"
				>
					<Download size={14} /> CSV
				</button>
			</div>

			<div
				class="glass-card premium-shadow divide-y divide-border-color overflow-hidden rounded-2xl p-4"
			>
				{#each historyList as entry (entry.id)}
					<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
						<div class="flex items-center gap-3">
							<span class="text-xs font-bold text-text-primary">
								{new Date(entry.date).toLocaleDateString(APP_LOCALE, {
									weekday: 'short',
									day: 'numeric',
									month: 'short',
									year: 'numeric'
								})}
							</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="hidden h-2 w-12 overflow-hidden rounded-full bg-surface-3 xs:block">
								<div class="h-full rounded-full bg-primary-600" style="width: {entry.total}%"></div>
							</div>
							<span class="text-xs font-bold text-primary-active tabular-nums"
								>{entry.total} Pts</span
							>
						</div>
					</div>
				{/each}

				{#if !showAllHistory && analyticsState.scores.length > 30}
					<div class="flex justify-center pt-3">
						<button
							onclick={() => (showAllHistory = true)}
							class="text-xs font-bold text-text-secondary hover:text-text-primary"
						>
							Mehr anzeigen
						</button>
					</div>
				{/if}
			</div>
		</section>
	{/if}
</div>
