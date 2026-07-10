<script lang="ts">
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { calculateStreak } from '$lib/features/habits/streak';
	import HabitForm from '$lib/features/habits/components/HabitForm.svelte';
	import HabitList from '$lib/features/habits/components/HabitList.svelte';
	import StreakCalendar from '$lib/features/habits/components/StreakCalendar.svelte';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) habitsState.load(id);
	});
	onDestroy(() => habitsState.unload());

	const streakStats = $derived(
		habitsState.habits.map((h) => ({
			habit: h,
			streak: calculateStreak(h.schedule, habitsState.logsFor(h.id))
		})).sort((a, b) => b.streak - a.streak)
	);

	const totalActiveStreaks = $derived(streakStats.filter((s) => s.streak > 0).length);
</script>

<svelte:head>
	<title>Gewohnheiten - Life OS</title>
</svelte:head>

<header class="mb-4">
	<h1 class="text-2xl font-bold tracking-tight">Gewohnheiten</h1>
</header>

<!-- Heatmap -->
{#if habitsState.habits.length > 0}
	<section class="mb-4 rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-text-primary">Aktivität — letzte 12 Wochen</h2>
			{#if totalActiveStreaks > 0}
				<span class="text-xs text-text-secondary">{totalActiveStreaks} aktive Streak{totalActiveStreaks !== 1 ? 's' : ''}</span>
			{/if}
		</div>
		<StreakCalendar habits={habitsState.habits} logsFor={(id) => habitsState.logsFor(id)} />

		<!-- Streak-Rangliste -->
		{#if streakStats.some((s) => s.streak > 0)}
			<div class="mt-4 flex flex-col gap-1 border-t border-border-color pt-3">
				{#each streakStats.filter((s) => s.streak > 0) as { habit, streak } (habit.id)}
					<div class="flex items-center gap-2">
						<span class="min-w-0 flex-1 truncate text-xs text-text-secondary">{habit.name}</span>
						<span class="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
							🔥 {streak} Tag{streak !== 1 ? 'e' : ''}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</section>
{/if}

<section class="mb-4">
	<HabitForm />
</section>

<section>
	<HabitList habits={habitsState.habits} />
</section>

