<script lang="ts">
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { moodState } from '$lib/features/mood/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import ScoreRing from '$lib/features/analytics/components/ScoreRing.svelte';
	import WeekSparkline from '$lib/features/analytics/components/WeekSparkline.svelte';
	import MoodHealthCorrelation from '$lib/features/analytics/components/MoodHealthCorrelation.svelte';
	import MoodActivityStats from '$lib/features/mood/components/MoodActivityStats.svelte';
	import { filterSince } from '$lib/features/mood/stats';
	import FocusStatsCard from '$lib/features/timetracking/components/FocusStatsCard.svelte';
	import MonthlyReport from '$lib/features/analytics/components/MonthlyReport.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import { Activity, Target, Repeat, Heart, SmilePlus, BookOpen, Zap, Dumbbell, TrendingUp, TrendingDown, Minus, Download } from 'lucide-svelte';
	import { APP_LOCALE } from '$lib/core/locale';
	import { toISODate } from '$lib/core/date';
	import { SCORE_WEIGHTS, SCORE_LABELS, weightLabel, scoreSeries, type ScoreKey } from '$lib/features/analytics/score-math';
	import { toCsv } from '$lib/features/analytics/report';

	let zeitraum = $state<30 | 90 | 365>(30);
	let showAllHistory = $state(false);

	$effect(() => {
		if (fitnessState.loaded) void fitnessState.loadAllSetLogs();
	});

	const series = $derived(scoreSeries(analyticsState.scores, zeitraum));
	const averageScore = $derived(
		series.filter(s => s.total !== null).length > 0
			? Math.round(series.filter(s => s.total !== null).reduce((a, b) => a + (b.total ?? 0), 0) / series.filter(s => s.total !== null).length)
			: 0
	);
	
	const historyList = $derived(showAllHistory ? analyticsState.scores.slice().reverse() : analyticsState.scores.slice().reverse().slice(0, 30));
	
	const moodStatsEntries = $derived(filterSince(moodState.entries, zeitraum));

	const breakdown = $derived(analyticsState.todayBreakdown ?? {
		tasks: 0, habits: 0, health: 0, fitness: 0, mood: 0, goals: 0, journal: 0, focus: 0
	});

	const yesterdayStr = $derived.by(() => {
		const d = new Date();
		d.setDate(d.getDate() - 1);
		return toISODate(d);
	});
	
	const yesterdayBreakdown = $derived.by(() => {
		const entry = analyticsState.scores.find((s) => s.date === yesterdayStr);
		return entry?.breakdown ?? null;
	});

	function trend(key: ScoreKey): 'up' | 'down' | 'flat' {
		const yb = yesterdayBreakdown;
		if (!yb) return 'flat';
		const today = breakdown[key] ?? 0;
		const yesterday = yb[key] ?? 0;
		if (today > yesterday + 3) return 'up';
		if (today < yesterday - 3) return 'down';
		return 'flat';
	}

	const KATEGORIE_STIL: Record<ScoreKey, { icon: typeof Target; color: string; bg: string }> = {
		tasks:   { icon: Target,    color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/20' },
		habits:  { icon: Repeat,    color: 'text-pink-500',   bg: 'bg-pink-50 dark:bg-pink-950/20' },
		health:  { icon: Heart,     color: 'text-cyan-500',   bg: 'bg-cyan-50 dark:bg-cyan-950/20' },
		fitness: { icon: Dumbbell,  color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
		goals:   { icon: Activity,  color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
		journal: { icon: BookOpen,  color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
		mood:    { icon: SmilePlus, color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/20' },
		focus:   { icon: Zap,       color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/20' }
	};

	const categories = $derived(
		(Object.keys(SCORE_WEIGHTS) as ScoreKey[])
			.sort((a, b) => SCORE_WEIGHTS[b] - SCORE_WEIGHTS[a])
			.map((key) => ({ key, name: SCORE_LABELS[key], weight: weightLabel(key), ...KATEGORIE_STIL[key] }))
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

<div class="space-y-6">
	<!-- Header -->
	<PageHeader title="Life Score" subtitle="Analysiere dein tägliches Wohlbefinden und Produktivität.">
		{#snippet trailing()}
			<div class="flex items-center gap-1 bg-surface-2 p-1 rounded-xl">
				{#each [30, 90, 365] as z}
					<button
						onclick={() => { zeitraum = z as any; }}
						class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all {zeitraum === z ? 'bg-surface-0 text-primary-active premium-shadow' : 'text-text-secondary hover:text-text-primary'}"
					>
						{z} T.
					</button>
				{/each}
			</div>
		{/snippet}
	</PageHeader>

	<!-- Core Dashboard -->
	<div class="grid gap-6 md:grid-cols-3">
		<!-- Ring / Score Card -->
		<div class="glass-card rounded-2xl p-6 premium-shadow flex flex-col items-center justify-center text-center">
			<ScoreRing score={analyticsState.todayScore} size={140} />
			<div class="mt-4">
				<h3 class="text-base font-bold text-text-primary">Heutiger Life Score</h3>
				<p class="text-xs text-text-secondary mt-1">Dein aktueller Tages-Score basierend auf deinen Daten.</p>
			</div>
		</div>

		<!-- Trend Sparkline -->
		<div class="glass-card rounded-2xl p-6 premium-shadow flex flex-col justify-between md:col-span-2">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-bold uppercase tracking-wider text-text-tertiary">Score-Verlauf</h3>
					<span class="text-3xl font-extrabold text-text-primary tabular-nums">{averageScore}</span>
					<span class="text-xs text-text-secondary ml-1">Ø-Score</span>
				</div>
			</div>
			
			<div class="my-4 flex justify-center py-2">
				<WeekSparkline scores={series} />
			</div>
			
			<div class="text-[11px] text-text-tertiary border-t border-border-color pt-3">
				Je beständiger du trackst, desto präziser ist dein durchschnittlicher Score.
			</div>
		</div>
	</div>

	<!-- Breakdown Details -->
	<section class="space-y-3">
		<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Heutige Aufschlüsselung</h2>
		<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each categories as cat (cat.key)}
				{@const Icon = cat.icon}
				{@const val = breakdown[cat.key] ?? 0}
				{@const t = trend(cat.key)}
				<div class="glass-card rounded-2xl p-4 premium-shadow flex items-center justify-between">
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
								<span class="text-lg font-extrabold text-text-primary tabular-nums">{val}%</span>
								{#if t === 'up'}
									<TrendingUp size={13} class="text-primary-500" />
								{:else if t === 'down'}
									<TrendingDown size={13} class="text-red-500" />
								{:else}
									<Minus size={13} class="text-text-faint" />
								{/if}
							</div>
						</div>
					</div>
					
					<!-- Progress mini bar -->
					<div class="h-10 w-1 bg-surface-3 rounded-full overflow-hidden">
						<div class="bg-primary-600 w-full rounded-full transition-all duration-1000" style="height: {val}%"></div>
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
		<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">
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
				<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Verlauf</h2>
				<button 
					onclick={exportCsv}
					class="text-xs font-bold text-primary-active hover:text-primary-600 flex items-center gap-1"
				>
					<Download size={14} /> CSV
				</button>
			</div>
			
			<div class="glass-card rounded-2xl p-4 premium-shadow overflow-hidden divide-y divide-border-color">
				{#each historyList as entry (entry.id)}
					<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
						<div class="flex items-center gap-3">
							<span class="text-xs font-bold text-text-primary">
								{new Date(entry.date).toLocaleDateString(APP_LOCALE, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
							</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="h-2 w-12 bg-surface-3 rounded-full overflow-hidden hidden xs:block">
								<div class="h-full bg-primary-600 rounded-full" style="width: {entry.total}%"></div>
							</div>
							<span class="text-xs font-bold tabular-nums text-primary-active">{entry.total} Pts</span>
						</div>
					</div>
				{/each}
				
				{#if !showAllHistory && analyticsState.scores.length > 30}
					<div class="pt-3 flex justify-center">
						<button 
							onclick={() => showAllHistory = true}
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
