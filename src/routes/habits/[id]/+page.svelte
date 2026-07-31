<script lang="ts">
	import { page } from '$app/state';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { bestStreak, calculateStreak, completionRate, isCompleted, isSkipped, streakUnit, totalCompleted, weekProgress } from '$lib/features/habits/streak';
	import PageHeader from '$lib/ui/PageHeader.svelte';
	import StreakCalendar from '$lib/features/habits/components/StreakCalendar.svelte';
	import HabitActionsSheet from '$lib/features/habits/components/HabitActionsSheet.svelte';
	import HabitProgressButton from '$lib/features/habits/components/HabitProgressButton.svelte';
	import ReminderSection from '$lib/features/reminders/components/ReminderSection.svelte';
	import { buildRrule } from '$lib/features/reminders/schedule';
	import Card from '$lib/ui/Card.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import Chip from '$lib/ui/Chip.svelte';
	import { Flame, Trophy, Calendar, CheckSquare, Ban, ArrowLeft, MoreVertical, Activity } from 'lucide-svelte';
	import { toISODate } from '$lib/core/date';

	const id = $derived(page.params.id as string);

	// Laden/Entladen liegt zentral in core/workspace-data.ts (+layout.svelte).

	const habit = $derived(habitsState.habitById(id));
	const entries = $derived(habit ? habitsState.entriesFor(habit.id) : []);

	const currentStreak = $derived(habit ? calculateStreak(habit, entries) : 0);
	const longestStreak = $derived(habit ? bestStreak(habit, entries) : 0);
	const allTimeDone = $derived(habit ? totalCompleted(habit, entries) : 0);
	const allTimeSkipped = $derived(entries.filter(d => isSkipped(d)).length);

	const unitStr = $derived(habit ? streakUnit(habit.schedule) : 'Tage');
	const isWeeklyCount = $derived(habit?.schedule.type === 'weekly_count');
	
	let actionsOpen = $state(false);
	let weeks = $state(12);
	const cRate = $derived(habit ? completionRate(habit, entries, weeks * 7) : { done: 0, due: 0, pct: 0 });

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
		<a href="/habits" class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary">
			<ArrowLeft size={16} /> Routinen
		</a>

		{#if habit.archived}
			<div class="flex items-center justify-between rounded-xl bg-surface-1 p-3 border border-border-color">
				<span class="text-sm font-medium text-text-secondary">Diese Routine ist archiviert.</span>
				<button onclick={() => habitsState.unarchiveHabit(habit.id)} class="text-sm font-bold text-primary-600 hover:underline">
					Wiederherstellen
				</button>
			</div>
		{/if}

		<PageHeader title={habit.name} subtitle="Routinen-Details">
			{#snippet trailing()}
				{#if !habit.archived}
					<div class="flex items-center gap-2">
						{#if habit.schedule.type === 'weekly_count' || (habit.target_value && habit.target_value > 1)}
							<HabitProgressButton {habit} />
						{:else}
							{@const logged = isCompleted(habit, habitsState.entryToday(habit.id))}
							<button onclick={() => habitsState.toggleToday(habit.id)}
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors active:scale-95 {logged ? 'border-primary-500 bg-primary-500 text-white' : 'border-border-color bg-surface-0 text-transparent'}"
								aria-label={logged ? 'Als offen markieren' : 'Als erledigt markieren'}>
								<CheckSquare size={18} />
							</button>
						{/if}
						<button
							onclick={() => (actionsOpen = true)}
							aria-label="Optionen"
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-1 text-text-primary transition-colors hover:bg-surface-2"
						>
							<MoreVertical size={20} />
						</button>
					</div>
				{/if}
			{/snippet}
		</PageHeader>

		<!-- Top Cards -->
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			<Card class="flex flex-col items-center justify-center p-4 text-center">
				<Flame class="mb-2 text-amber-500" size={24} />
				<span class="text-2xl font-bold text-text-primary">{currentStreak}</span>
				<span class="text-xs text-text-secondary">Aktueller Streak ({unitStr})</span>
			</Card>
			<Card class="flex flex-col items-center justify-center p-4 text-center">
				<Trophy class="mb-2 text-primary-500" size={24} />
				<span class="text-2xl font-bold text-text-primary">{longestStreak}</span>
				<span class="text-xs text-text-secondary">Bester Streak ({unitStr})</span>
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
			{#if isWeeklyCount}
				{@const wp = weekProgress(habit, entries)}
				<Card class="col-span-2 flex flex-col items-center justify-center p-4 text-center sm:col-span-4">
					<div class="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-surface-3 mb-2">
						<div class="h-full {wp.done >= wp.target ? 'bg-emerald-500' : 'bg-primary-500'}"
							 style="width: {Math.min(100, (wp.done / Math.max(1, wp.target)) * 100)}%"></div>
					</div>
					<span class="text-lg font-bold text-text-primary">{wp.done} / {wp.target}</span>
					<span class="text-xs text-text-secondary">Diese Woche</span>
				</Card>
			{/if}
			<Card class="col-span-2 flex flex-col items-center justify-center p-4 text-center sm:col-span-4">
				<Activity class="mb-2 text-primary-400" size={24} />
				<span class="text-2xl font-bold text-text-primary">{cRate.pct}%</span>
				<span class="text-xs text-text-secondary">{cRate.done} von {cRate.due} fälligen Tagen erfüllt</span>
			</Card>
		</div>

		<!-- Heatmap -->
		<Card shadow class="p-4">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
				<h3 class="text-sm font-semibold text-text-primary">Aktivität</h3>
				<!-- Hinweis: VERLAUF_TAGE.habitLogs ist per default 400. Fuer 52W muessten wir >365 laden. -->
				<div class="flex gap-1">
					{#each [12, 26, 52] as w}
						<Chip selected={weeks === w} onclick={() => (weeks = w)}>{w} W</Chip>
					{/each}
				</div>
			</div>
			<StreakCalendar habits={[habit]} entriesFor={() => entries} {weeks} />
		</Card>

		<!-- Info -->
		{#if habit.target_value}
			<Card class="p-4">
				<h3 class="mb-2 text-sm font-semibold text-text-primary">Ziel-Menge</h3>
				<p class="text-sm text-text-secondary">Diese Routine hat ein tägliches Ziel von {habit.target_value} {habit.unit ?? 'Stk'}.</p>
			</Card>
		{/if}

		<!-- Reminder -->
		{#if !habit.archived}
			<Card class="p-4">
				<ReminderSection
					entityType="habit"
					entityId={habit.id}
					title={habit.name}
					url="/habits/{habit.id}"
					mode="time"
					rrule={buildRrule(habit.schedule)}
					defaultTime="08:00"
				/>
			</Card>
		{/if}

		<!-- Letzte Einträge -->
		<section>
			<h3 class="mb-3 text-sm font-semibold text-text-primary">Letzte Einträge</h3>
			{#if history.length === 0}
				<EmptyState title="Noch keine Einträge vorhanden." />
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
	<HabitActionsSheet bind:open={actionsOpen} {habit} showStatsLink={false} onClose={() => (actionsOpen = false)} />
{/if}
