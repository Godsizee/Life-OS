<script lang="ts">
	import { onDestroy } from 'svelte';
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { moodState } from '$lib/features/mood/store.svelte';
	import { healthState } from '$lib/features/health/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import ScoreRing from '$lib/features/analytics/components/ScoreRing.svelte';
	import WeekSparkline from '$lib/features/analytics/components/WeekSparkline.svelte';
	import MoodHealthCorrelation from '$lib/features/analytics/components/MoodHealthCorrelation.svelte';
	import MonthlyReport from '$lib/features/analytics/components/MonthlyReport.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import { Activity, Target, Repeat, Heart, SmilePlus, BookOpen, Zap, Dumbbell, TrendingUp, TrendingDown, Minus } from 'lucide-svelte';
	import { APP_LOCALE } from '$lib/core/locale';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			analyticsState.load();
			moodState.load();
			healthState.load();
			// Für den Monatsbericht (5.7) nötig.
			tasksState.load(id);
			habitsState.load(id);
			goalsState.load(id);
			fitnessState.load(id);
		}
	});
	onDestroy(() => {
		tasksState.unload();
		habitsState.unload();
		goalsState.unload();
		fitnessState.unload();
	});

	const scoresArray = $derived(analyticsState.scores.map((s) => s.total));
	const averageScore = $derived(
		scoresArray.length > 0
			? Math.round(scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length)
			: 0
	);

	const breakdown = $derived(analyticsState.todayBreakdown() ?? {
		tasks: 0,
		habits: 0,
		health: 0,
		fitness: 0,
		mood: 0,
		goals: 0,
		journal: 0,
		focus: 0
	});

	// Gestern-Breakdown für Trendpfeil (#12)
	const yesterdayStr = $derived(() => {
		const d = new Date();
		d.setDate(d.getDate() - 1);
		return d.toISOString().split('T')[0];
	});
	const yesterdayBreakdown = $derived(() => {
		const entry = analyticsState.scores.find((s) => s.date === yesterdayStr());
		return entry?.breakdown ?? null;
	});

	function trend(key: string): 'up' | 'down' | 'flat' {
		const yb = yesterdayBreakdown();
		if (!yb) return 'flat';
		const today = (breakdown as any)[key] ?? 0;
		const yesterday = (yb as any)[key] ?? 0;
		if (today > yesterday + 3) return 'up';
		if (today < yesterday - 3) return 'down';
		return 'flat';
	}

	const categories = $derived([
		{ name: 'Aufgaben',    key: 'tasks',   icon: Target,    color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/20',    weight: '22%' },
		{ name: 'Routinen',   key: 'habits',  icon: Repeat,    color: 'text-pink-500',    bg: 'bg-pink-50 dark:bg-pink-950/20',    weight: '22%' },
		{ name: 'Gesundheit', key: 'health',  icon: Heart,     color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/20', weight: '13%' },
		{ name: 'Fitness',    key: 'fitness', icon: Dumbbell,  color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950/20', weight: '10%' },
		{ name: 'Ziele',      key: 'goals',   icon: Activity,  color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-950/20', weight: '10%' },
		{ name: 'Tagebuch',   key: 'journal', icon: BookOpen,  color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-950/20', weight: '10%' },
		{ name: 'Stimmung',   key: 'mood',    icon: SmilePlus, color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/20',  weight: '8%' },
		{ name: 'Fokus',      key: 'focus',   icon: Zap,       color: 'text-yellow-500',  bg: 'bg-yellow-50 dark:bg-yellow-950/20', weight: '5%'  }
	]);
</script>

<svelte:head>
	<title>Analytics - Life Score Detail</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<PageHeader title="Life Score" subtitle="Analysiere dein tägliches Wohlbefinden und Produktivität." />

	<!-- Core Dashboard -->
	<div class="grid gap-6 md:grid-cols-3">
		<!-- Ring / Score Card -->
		<div class="glass-card rounded-2xl p-6 premium-shadow flex flex-col items-center justify-center text-center">
			<ScoreRing score={analyticsState.todayScore()} size={140} />
			<div class="mt-4">
				<h3 class="text-base font-bold text-text-primary">Heutiger Life Score</h3>
				<p class="text-xs text-text-secondary mt-1">Berechnet aus Aufgaben, Gewohnheiten, Fitness und Gesundheit logs.</p>
			</div>
		</div>

		<!-- Trend Sparkline -->
		<div class="glass-card rounded-2xl p-6 premium-shadow flex flex-col justify-between md:col-span-2">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-bold uppercase tracking-wider text-text-tertiary">Score Trend (30 Tage)</h3>
					<span class="text-3xl font-extrabold text-text-primary tabular-nums">{averageScore}</span>
					<span class="text-xs text-text-secondary ml-1">ø Ø-Score</span>
				</div>
				<div class="text-xs font-semibold text-text-tertiary">Trend 7 Tage</div>
			</div>
			
			<div class="my-4 flex justify-center py-2">
				<WeekSparkline scores={scoresArray} />
			</div>
			
			<div class="text-[11px] text-text-tertiary border-t border-border-color pt-3">
				Je beständiger du trackst, desto präziser ist dein durchschnittlicher Score.
			</div>
		</div>
	</div>

	<!-- Breakdown Details mit Sub-Score-Labels, Gewichten und Trendpfeilen (#12) -->
	<section class="space-y-3">
		<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Heutige Aufschlüsselung</h2>
		<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each categories as cat}
				{@const Icon = cat.icon}
				{@const val = (breakdown as any)[cat.key] ?? 0}
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

	<!-- Monatsbericht (Welle 5.7) -->
	<MonthlyReport days={30} />

	<!-- Mood ↔ Health Korrelation (#5) -->
	<MoodHealthCorrelation />

	<!-- History Feed -->
	{#if analyticsState.scores.length > 0}
		<section class="space-y-3">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Verlauf</h2>
			<div class="glass-card rounded-2xl p-4 premium-shadow overflow-hidden divide-y divide-border-color">
				{#each analyticsState.scores.slice().reverse() as entry}
					<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
						<div class="flex items-center gap-3">
							<span class="text-xs font-bold text-text-primary">
								{new Date(entry.date).toLocaleDateString(APP_LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })}
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
			</div>
		</section>
	{/if}
</div>
