<script lang="ts">
	import { Trash2 } from 'lucide-svelte';
	import type { Goal, GoalStatus } from '../types';
	import { goalsState } from '../store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { calculateHabitProgress30Days } from '$lib/features/habits/streak';
	import { getGoalProgress } from '../progress';

	let { goal }: { goal: Goal } = $props();

	const statusLabel: Record<GoalStatus, string> = {
		open: 'Offen',
		in_progress: 'In Arbeit',
		done: 'Erledigt'
	};

	// Tasks und Habits die diesem Ziel zugeordnet sind
	const linkedTasks = $derived(tasksState.tasks.filter((t) => t.goal_id === goal.id));
	const linkedDone = $derived(linkedTasks.filter((t) => t.status === 'done'));
	const linkedHabits = $derived(habitsState.habits.filter((h) => h.goal_id === goal.id && !h.archived));

	// Wenn Tasks oder Habits verknüpft: automatischer Fortschritt; sonst: manueller Slider
	const isAuto = $derived(linkedTasks.length > 0 || linkedHabits.length > 0);
	const displayProgress = $derived(getGoalProgress(goal));
</script>

<li class="rounded-xl border border-border-color bg-surface-0 p-3">
	<div class="flex items-start justify-between gap-2">
		<a href="/goals/{goal.id}" class="min-w-0 flex-1 truncate font-medium text-text-primary hover:text-primary-active hover:underline">
			{goal.title}
			{#if goal.goal_type === 'pr'}<span class="ml-1 text-xs">🏋️</span>{/if}
		</a>
		<button
			onclick={() => goalsState.removeGoal(goal.id)}
			aria-label="Löschen"
			class="shrink-0 text-text-tertiary active:text-red-600 dark:active:text-red-400"
		>
			<Trash2 size={18} />
		</button>
	</div>

	<!-- Fortschritts-Balken -->
	<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2 border border-border-color/20">
		<div
			class="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-500"
			style="width: {displayProgress}%"
		></div>
	</div>

	<!-- Verknüpfte Elemente als Chips -->
	{#if isAuto}
		<div class="mt-2 flex flex-col gap-1.5">
			{#if linkedTasks.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each linkedTasks.slice(0, 4) as task (task.id)}
						<span
							class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium {task.status ===
							'done'
								? 'bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 line-through'
								: 'bg-surface-2 text-text-secondary border border-border-color/30'}"
						>
							{task.status === 'done' ? '✓' : '○'}
							{task.title.length > 20 ? task.title.slice(0, 20) + '…' : task.title}
						</span>
					{/each}
					{#if linkedTasks.length > 4}
						<span class="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-text-secondary border border-border-color/30">
							+{linkedTasks.length - 4} weitere
						</span>
					{/if}
				</div>
			{/if}

			{#if linkedHabits.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each linkedHabits.slice(0, 4) as habit (habit.id)}
						{@const progress = calculateHabitProgress30Days(habit.schedule, habitsState.logsFor(habit.id))}
						<span
							class="inline-flex items-center gap-1 rounded-full bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30 px-2 py-0.5 text-[10px] font-medium"
						>
							🔁 {habit.name} ({progress}%)
						</span>
					{/each}
					{#if linkedHabits.length > 4}
						<span class="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-text-secondary border border-border-color/30">
							+{linkedHabits.length - 4} weitere
						</span>
					{/if}
				</div>
			{/if}
		</div>

		<p class="mt-1 text-xs text-text-tertiary">
			{#if linkedTasks.length > 0 && linkedHabits.length > 0}
				{linkedDone.length}/{linkedTasks.length} Aufgaben & {linkedHabits.length} Routinen verknüpft
			{:else if linkedHabits.length > 0}
				{linkedHabits.length} Routinen verknüpft
			{:else}
				{linkedDone.length}/{linkedTasks.length} Aufgaben erledigt · {displayProgress}%
			{/if}
		</p>
	{:else}
		<!-- Kein Link: manueller Slider -->
		<div class="mt-2">
			<input
				type="range"
				min="0"
				max="100"
				step="10"
				value={goal.progress}
				onchange={(e) => goalsState.updateProgress(goal.id, Number(e.currentTarget.value))}
				class="h-8 w-full accent-primary-600 dark:accent-primary-500"
				aria-label="Fortschritt"
			/>
		</div>
	{/if}

	<div class="mt-2 flex items-center justify-between gap-2">
		<span class="text-xs text-text-tertiary">{displayProgress}%</span>
		<select
			value={goal.status}
			onchange={(e) => goalsState.setStatus(goal.id, e.currentTarget.value as GoalStatus)}
			class="min-h-12 rounded-xl border border-border-color bg-surface-0 px-2 text-xs text-text-primary focus:border-primary-500 focus:outline-none transition-colors duration-200"
		>
			{#each Object.entries(statusLabel) as [value, label] (value)}
				<option {value}>{label}</option>
			{/each}
		</select>
	</div>
</li>
