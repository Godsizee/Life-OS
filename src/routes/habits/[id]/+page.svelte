<script lang="ts">
	import { page } from '$app/stores';
	import { onDestroy } from 'svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { calculateStreak, isSkipped, isCompleted } from '$lib/features/habits/streak';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import StreakCalendar from '$lib/features/habits/components/StreakCalendar.svelte';
	import Card from '$lib/ui/Card.svelte';
	import { Flame, Trophy, Calendar, CheckSquare, Ban } from 'lucide-svelte';
	import { toISODate } from '$lib/core/date';

	let id = $derived($page.params.id);

	$effect(() => {
		const wId = workspaceState.workspace?.id;
		if (wId) habitsState.load(wId);
	});

	onDestroy(() => habitsState.unload());

	const habit = $derived(habitsState.habits.find((h) => h.id === id));
	const entries = $derived(habit ? habitsState.entriesFor(habit.id) : []);

	const currentStreak = $derived(habit ? calculateStreak(habit, entries) : 0);
	
	// Längste Streak berechnen
	const longestStreak = $derived(
		habit ? (() => {
			let max = 0;
			let current = 0;
			// Rückwärts iterieren
			for (let i = 0; i < entries.length; i++) {
				const day = entries[i];
				if (isSkipped(day)) continue;
				if (isCompleted(habit, day)) {
					current++;
					if (current > max) max = current;
				} else {
					current = 0; // Bruch
				}
			}
			return max;
		})() : 0
	);

	const allTimeDone = $derived(habit ? entries.filter(d => isCompleted(habit, d)).length : 0);
	const allTimeSkipped = $derived(entries.filter(d => isSkipped(d)).length);

	const history = $derived(
		[...entries]
			.sort((a, b) => b.date.localeCompare(a.date))
			.slice(0, 10)
	);
</script>

<svelte:head>
	<title>{habit?.name ?? 'Routine'} - Life OS</title>
</svelte:head>

{#if !habit}
	<div class="py-12 text-center text-text-tertiary">Routine nicht gefunden.</div>
{:else}
	<div class="space-y-6">
		<PageHeader title={habit.name} subtitle="Routinen-Details" />

		<!-- Top Cards -->
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			<Card class="flex flex-col items-center justify-center p-4 text-center">
				<Flame class="mb-2 text-amber-500" size={24} />
				<span class="text-2xl font-bold text-text-primary">{currentStreak}</span>
				<span class="text-xs text-text-secondary">Aktueller Streak</span>
			</Card>
			<Card class="flex flex-col items-center justify-center p-4 text-center">
				<Trophy class="mb-2 text-primary-500" size={24} />
				<span class="text-2xl font-bold text-text-primary">{Math.max(currentStreak, longestStreak)}</span>
				<span class="text-xs text-text-secondary">Bester Streak</span>
			</Card>
			<Card class="flex flex-col items-center justify-center p-4 text-center">
				<CheckSquare class="mb-2 text-green-500" size={24} />
				<span class="text-2xl font-bold text-text-primary">{allTimeDone}</span>
				<span class="text-xs text-text-secondary">Gesamt erfüllt</span>
			</Card>
			<Card class="flex flex-col items-center justify-center p-4 text-center">
				<Ban class="mb-2 text-text-tertiary" size={24} />
				<span class="text-2xl font-bold text-text-primary">{allTimeSkipped}</span>
				<span class="text-xs text-text-secondary">Übersprungen</span>
			</Card>
		</div>

		<!-- Heatmap -->
		<Card shadow class="p-4">
			<h3 class="mb-4 text-sm font-semibold text-text-primary">Aktivität (Letzte 12 Wochen)</h3>
			<StreakCalendar habits={[habit]} entriesFor={() => entries} />
		</Card>

		<!-- Info -->
		{#if habit.target_value}
			<Card class="p-4">
				<h3 class="mb-2 text-sm font-semibold text-text-primary">Ziel-Menge</h3>
				<p class="text-sm text-text-secondary">Diese Routine hat ein tägliches Ziel von {habit.target_value} {habit.unit ?? 'Stk'}.</p>
			</Card>
		{/if}

		<!-- Letzte Einträge -->
		<section>
			<h3 class="mb-3 text-sm font-semibold text-text-primary">Letzte Einträge</h3>
			{#if history.length === 0}
				<div class="rounded-xl border border-border-color bg-surface-0 p-4 text-center text-sm text-text-secondary">
					Noch keine Einträge vorhanden.
				</div>
			{:else}
				<div class="overflow-hidden rounded-xl border border-border-color bg-surface-0 shadow-sm">
					<ul class="divide-y divide-border-color">
						{#each history as entry (entry.date)}
							<li class="flex items-center justify-between p-3">
								<div class="flex items-center gap-3">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2">
										<Calendar size={14} class="text-text-tertiary" />
									</div>
									<span class="text-sm font-medium text-text-primary">
										{new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
									</span>
								</div>
								<div class="flex flex-col items-end">
									{#if isSkipped(entry)}
										<span class="inline-flex rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text-secondary">Übersprungen</span>
									{:else if isCompleted(habit, entry)}
										<span class="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">Erledigt</span>
										{#if habit.target_value && entry.value}
											<span class="mt-0.5 text-[10px] text-text-tertiary">{entry.value} / {habit.target_value} {habit.unit}</span>
										{/if}
									{:else}
										<span class="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Teilweise</span>
										{#if habit.target_value && entry.value}
											<span class="mt-0.5 text-[10px] text-text-tertiary">{entry.value} / {habit.target_value} {habit.unit}</span>
										{/if}
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</section>
	</div>
{/if}
