<script lang="ts">
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { calculateStreak, bestStreak } from '$lib/features/habits/streak';
	import HabitForm from '$lib/features/habits/components/HabitForm.svelte';
	import HabitList from '$lib/features/habits/components/HabitList.svelte';
	import StreakCalendar from '$lib/features/habits/components/StreakCalendar.svelte';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import Skeleton from '$lib/ui/Skeleton.svelte';
	import { Plus } from 'lucide-svelte';

	let createOpen = $state(false);

	// Laden/Entladen liegt zentral in core/workspace-data.ts (+layout.svelte).
	const streakStats = $derived(
		habitsState.habits.map((h) => {
			const entries = habitsState.entriesFor(h.id);
			return {
				habit: h,
				streak: calculateStreak(h, entries),
				best: bestStreak(h, entries)
			};
		}).sort((a, b) => b.streak - a.streak)
	);

	const totalActiveStreaks = $derived(streakStats.filter((s) => s.streak > 0).length);
</script>

<svelte:head>
	<title>Gewohnheiten - Life OS</title>
</svelte:head>

<PageHeader title="Gewohnheiten">
	{#snippet trailing()}
		<button
			onclick={() => (createOpen = true)}
			aria-label="Neue Gewohnheit"
			class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white active:scale-95 transition-transform"
		>
			<Plus size={22} />
		</button>
	{/snippet}
</PageHeader>

<Sheet bind:open={createOpen} title="Neue Gewohnheit">
	{#snippet children()}
		<div class="p-4">
			<HabitForm onsubmitted={() => (createOpen = false)} />
		</div>
	{/snippet}
</Sheet>

<!-- Heatmap -->
{#if habitsState.habits.length > 0}
	<section class="mb-4 rounded-xl border border-border-color bg-surface-0 p-4 shadow-sm">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-text-primary">Aktivität — letzte 12 Wochen</h2>
			{#if totalActiveStreaks > 0}
				<span class="text-xs text-text-secondary">{totalActiveStreaks} aktive Streak{totalActiveStreaks !== 1 ? 's' : ''}</span>
			{/if}
		</div>
		<StreakCalendar habits={habitsState.habits} entriesFor={(id) => habitsState.entriesFor(id)} />

		<!-- Streak-Rangliste -->
		{#if streakStats.some((s) => s.streak > 0 || s.best > 0)}
			<div class="mt-4 flex flex-col gap-1 border-t border-border-color pt-3">
				{#each streakStats.filter((s) => s.streak > 0 || s.best > 0) as { habit, streak, best } (habit.id)}
					<div class="flex items-center gap-2">
						<span class="min-w-0 flex-1 truncate text-xs text-text-secondary">{habit.name}</span>
						<span class="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
							🔥 {streak} {habit.schedule.type === 'weekly_count' ? 'Wochen' : 'Tage'} <span class="text-text-tertiary opacity-70 ml-1">· Best {best}</span>
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</section>
{/if}

<section>
	{#if habitsState.loading}
		<div class="flex flex-col gap-2">
			<Skeleton height="3.5rem" />
			<Skeleton height="3.5rem" />
			<Skeleton height="3.5rem" />
		</div>
	{:else}
		<HabitList habits={habitsState.habits} />
	{/if}
</section>

{#if habitsState.archived.length > 0 || !habitsState.archivedLoaded}
	<details class="mt-6" ontoggle={() => habitsState.loadArchived()}>
		<summary class="cursor-pointer text-sm font-medium text-text-secondary">
			Archiv{habitsState.archivedLoaded ? ` (${habitsState.archived.length})` : ''}
		</summary>
		<ul class="mt-2 flex flex-col gap-1.5">
			{#each habitsState.archived as h (h.id)}
				<li class="flex items-center gap-2 rounded-lg border border-border-color bg-surface-1 px-2.5 py-2">
					<span class="min-w-0 flex-1 truncate text-sm text-text-secondary">{h.name}</span>
					<a href="/habits/{h.id}" class="shrink-0 text-xs text-text-tertiary hover:underline">Verlauf</a>
					<button onclick={() => habitsState.unarchiveHabit(h.id)}
					        class="shrink-0 text-xs font-medium text-primary-active hover:underline">
						Wiederherstellen
					</button>
				</li>
			{/each}
		</ul>
	</details>
{/if}

