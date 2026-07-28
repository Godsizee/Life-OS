<script lang="ts">
	import { habitsState } from '../store.svelte';
	import type { Habit } from '../types';
	import { isCompleted, isSkipped, calculateStreak, streakLabel } from '../streak';
	import { Flame, MoreVertical, Bell } from 'lucide-svelte';
	import HabitProgressButton from './HabitProgressButton.svelte';
	import HabitActionsSheet from './HabitActionsSheet.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import ReminderSection from '$lib/features/reminders/components/ReminderSection.svelte';
	import { buildRrule } from '$lib/features/reminders/schedule';
	import { remindersState } from '$lib/features/reminders/store.svelte';

	interface Props {
		habit: Habit;
	}
	const { habit }: Props = $props();

	let actionsOpen = $state(false);
	let reminderOpen = $state(false);
	const reminderCount = $derived(remindersState.forEntity('habit', habit.id).length);

	const days = $derived(habitsState.entriesFor(habit.id));
	const day = $derived(habitsState.entryToday(habit.id));
	const done = $derived(isCompleted(habit, day));
	const skipped = $derived(isSkipped(day));
	const currentStreak = $derived(calculateStreak(habit, days));
</script>

<!-- W5: Neu strukturiertes Listen-Element mit HabitProgressButton -->
<div
	class="group relative flex items-center gap-3 overflow-hidden rounded-xl border p-2 pl-3 transition-colors
	{done || skipped ? 'border-border-color bg-surface-1' : 'border-primary-100 bg-surface-0 shadow-sm dark:border-primary-900/30'}"
>
	<HabitProgressButton {habit} />

	<div class="flex min-w-0 flex-1 flex-col justify-center">
		<!-- Name mit Durchstreichen bei Erledigt/Skip -->
		<span class="truncate text-sm font-bold {done || skipped ? 'text-text-secondary line-through' : 'text-text-primary'}">
			{habit.name}
		</span>
		
		<!-- W5: Subtitel (Streak + Mengen-Info) -->
		<div class="mt-0.5 flex items-center gap-2 text-xs font-medium text-text-tertiary">
			{#if currentStreak >= 3}
				<span class="inline-flex items-center gap-0.5 text-amber-500">
					<Flame size={12} class="animate-pulse" /> {streakLabel(habit.schedule, currentStreak)}
				</span>
			{/if}
			{#if habit.target_value && habit.target_value > 1 && !done && !skipped}
				<span>Ziel: {habit.target_value} {habit.unit ?? 'Stk'}</span>
			{/if}
		</div>
	</div>

	<button
		onclick={() => (reminderOpen = true)}
		aria-label="Erinnerung"
		class="mr-1 shrink-0 {reminderCount > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-text-tertiary'}"
	>
		<Bell size={18} />
	</button>

	<!-- Kontext-Menü (W5 HabitActionsSheet) -->
	<button
		onclick={() => (actionsOpen = true)}
		aria-label="Optionen"
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-2 hover:text-text-primary"
	>
		<MoreVertical size={18} />
	</button>
</div>

<Sheet bind:open={reminderOpen} title={habit.name}>
	<div class="p-4">
		<ReminderSection
			entityType="habit"
			entityId={habit.id}
			title={habit.name}
			url="/habits"
			mode="time"
			rrule={buildRrule(habit.schedule)}
			defaultTime="08:00"
		/>
	</div>
</Sheet>

<HabitActionsSheet bind:open={actionsOpen} {habit} onClose={() => (actionsOpen = false)} />
