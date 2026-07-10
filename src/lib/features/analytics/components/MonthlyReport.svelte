<script lang="ts">
	import { buildPeriodReport } from '../report';
	import { TrendingUp, CheckSquare, Dumbbell, BookOpen, Flame, Target, Trophy } from 'lucide-svelte';

	let { days = 30 }: { days?: number } = $props();

	const report = $derived(buildPeriodReport(days));

	const tiles = $derived([
		{ icon: TrendingUp, label: 'Ø Score', value: `${report.avgScore}`, sub: `Best: ${report.bestScore}` },
		{ icon: CheckSquare, label: 'Aufgaben', value: `${report.tasksCompleted}`, sub: 'erledigt' },
		{ icon: Dumbbell, label: 'Workouts', value: `${report.workouts}`, sub: 'Sessions' },
		{ icon: BookOpen, label: 'Tagebuch', value: `${report.journalDays}`, sub: 'Tage' },
		{ icon: Target, label: 'Ziele', value: `${report.goalsDone}`, sub: 'erreicht' },
		{ icon: Trophy, label: 'Neue PRs', value: `${report.newPRs}`, sub: 'Rekorde' },
		{
			icon: Flame,
			label: 'Längste Streak',
			value: `${report.longestStreak.days}`,
			sub: report.longestStreak.name
		}
	]);
</script>

<section class="space-y-3">
	<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">
		Dein Monat in Zahlen ({days} Tage)
	</h2>
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
		{#each tiles as tile (tile.label)}
			{@const Icon = tile.icon}
			<div class="glass-card flex items-center gap-3 rounded-2xl p-4 premium-shadow">
				<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-primary-active">
					<Icon size={18} />
				</div>
				<div class="min-w-0">
					<div class="text-lg font-extrabold tabular-nums text-text-primary">{tile.value}</div>
					<div class="truncate text-[11px] text-text-tertiary">{tile.label} · {tile.sub}</div>
				</div>
			</div>
		{/each}
	</div>
</section>
