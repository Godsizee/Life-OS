<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { linksState } from '$lib/features/links/store.svelte';
	import { getGoalProgress } from '$lib/features/goals/progress';
	import { calculateHabitProgress30Days } from '$lib/features/habits/streak';
	import LinkedItems from '$lib/features/links/components/LinkedItems.svelte';
	import { ArrowLeft, Trash2, X, Dumbbell } from 'lucide-svelte';
	import type { GoalStatus } from '$lib/features/goals/types';

	const goalId = $derived(page.params.id);

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			goalsState.load(id);
			tasksState.load(id);
			habitsState.load(id);
			fitnessState.load(id);
			linksState.load(id);
		}
	});
	onDestroy(() => {
		goalsState.unload();
		tasksState.unload();
		habitsState.unload();
		fitnessState.unload();
		linksState.unload();
	});

	const goal = $derived(goalsState.goals.find((g) => g.id === goalId) ?? null);
	const progress = $derived(goal ? getGoalProgress(goal) : 0);

	const linkedTasks = $derived(goal ? tasksState.tasks.filter((t) => t.goal_id === goal.id) : []);
	const linkedHabits = $derived(
		goal ? habitsState.habits.filter((h) => h.goal_id === goal.id && !h.archived) : []
	);
	const unlinkedTasks = $derived(
		tasksState.tasks.filter((t) => t.status !== 'done' && t.goal_id !== goalId)
	);
	const unlinkedHabits = $derived(
		habitsState.habits.filter((h) => !h.archived && h.goal_id !== goalId)
	);

	const pr = $derived(
		goal?.goal_type === 'pr' && goal.target_exercise
			? fitnessState.prFor(goal.target_exercise)
			: undefined
	);

	const statusLabel: Record<GoalStatus, string> = {
		open: 'Offen',
		in_progress: 'In Arbeit',
		done: 'Erledigt'
	};

	function linkTask(e: Event) {
		const id = (e.currentTarget as HTMLSelectElement).value;
		if (id && goalId) tasksState.updateGoalLink(id, goalId);
		(e.currentTarget as HTMLSelectElement).value = '';
	}
	function linkHabit(e: Event) {
		const id = (e.currentTarget as HTMLSelectElement).value;
		if (id && goalId) habitsState.updateGoalLink(id, goalId);
		(e.currentTarget as HTMLSelectElement).value = '';
	}

	async function removeGoal() {
		if (!goal) return;
		await goalsState.removeGoal(goal.id);
		goto('/goals');
	}
</script>

<svelte:head>
	<title>{goal ? goal.title : 'Ziel'} - Life OS</title>
</svelte:head>

<a href="/goals" class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary">
	<ArrowLeft size={16} /> Ziele
</a>

{#if !goal}
	<div class="rounded-2xl border border-border-color bg-surface-0 p-8 text-center text-text-secondary">
		{#if goalsState.loading}
			Lade Ziel…
		{:else}
			Ziel nicht gefunden.
		{/if}
	</div>
{:else}
	<div class="space-y-6">
		<!-- Kopf -->
		<header class="space-y-3">
			<div class="flex items-start justify-between gap-3">
				<h1 class="text-2xl font-bold tracking-tight text-text-primary">{goal.title}</h1>
				<button onclick={removeGoal} aria-label="Ziel löschen" class="shrink-0 text-text-tertiary hover:text-red-500">
					<Trash2 size={18} />
				</button>
			</div>
			{#if goal.description}
				<p class="text-sm text-text-secondary">{goal.description}</p>
			{/if}

			<!-- Fortschritt -->
			<div class="space-y-1.5">
				<div class="flex items-center justify-between text-xs">
					<span class="font-semibold text-text-primary">{progress}%</span>
					{#if goal.target_date}
						<span class="text-text-tertiary">Zieldatum: {new Date(goal.target_date).toLocaleDateString('de-DE')}</span>
					{/if}
				</div>
				<div class="h-2.5 w-full overflow-hidden rounded-full bg-surface-2 border border-border-color/20">
					<div class="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500" style="width: {progress}%"></div>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<select
					value={goal.status}
					onchange={(e) => goalsState.setStatus(goal.id, e.currentTarget.value as GoalStatus)}
					class="min-h-11 rounded-xl border border-border-color bg-surface-0 px-3 text-xs text-text-primary focus:border-emerald-500 focus:outline-none"
				>
					{#each Object.entries(statusLabel) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</select>
			</div>
		</header>

		<!-- PR-Ziel -->
		{#if goal.goal_type === 'pr' && goal.target_exercise}
			<section class="rounded-2xl border border-border-color bg-surface-0 p-4">
				<h2 class="mb-2 flex items-center gap-1.5 text-sm font-bold text-text-primary">
					<Dumbbell size={16} /> Kraft-Ziel
				</h2>
				<div class="flex items-baseline justify-between text-sm">
					<span class="text-text-secondary">{goal.target_exercise}</span>
					<span class="font-mono text-text-primary">
						{pr ? pr.est_1rm : 0} / {goal.target_value} kg
					</span>
				</div>
				<p class="mt-1 text-xs text-text-tertiary">
					{pr
						? `Aktuelles geschätztes 1RM: ${pr.est_1rm} kg (${pr.weight_kg} kg × ${pr.reps})`
						: 'Noch kein Workout mit dieser Übung geloggt.'}
				</p>
			</section>
		{/if}

		<!-- Verknüpfte Aufgaben -->
		<section class="space-y-2">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Aufgaben</h2>
			{#if linkedTasks.length > 0}
				<ul class="flex flex-col gap-1.5">
					{#each linkedTasks as task (task.id)}
						<li class="flex items-center gap-2 rounded-lg border border-border-color bg-surface-1 px-2.5 py-1.5">
							<span class="text-xs">{task.status === 'done' ? '✓' : '○'}</span>
							<span class="min-w-0 flex-1 truncate text-sm text-text-primary {task.status === 'done' ? 'line-through opacity-60' : ''}">{task.title}</span>
							<button onclick={() => tasksState.updateGoalLink(task.id, null)} aria-label="Aufgabe entkoppeln" class="shrink-0 text-text-tertiary hover:text-red-500">
								<X size={14} />
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			{#if unlinkedTasks.length > 0}
				<select onchange={linkTask} class="min-h-11 w-full rounded-xl border border-border-color bg-surface-0 px-3 text-xs text-text-secondary focus:border-emerald-500 focus:outline-none">
					<option value="">+ Aufgabe verknüpfen…</option>
					{#each unlinkedTasks as task (task.id)}
						<option value={task.id}>{task.title}</option>
					{/each}
				</select>
			{/if}
		</section>

		<!-- Verknüpfte Routinen -->
		<section class="space-y-2">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Routinen</h2>
			{#if linkedHabits.length > 0}
				<ul class="flex flex-col gap-1.5">
					{#each linkedHabits as habit (habit.id)}
						{@const hp = calculateHabitProgress30Days(habit.schedule, habitsState.logsFor(habit.id))}
						<li class="flex items-center gap-2 rounded-lg border border-border-color bg-surface-1 px-2.5 py-1.5">
							<span class="text-xs">🔁</span>
							<span class="min-w-0 flex-1 truncate text-sm text-text-primary">{habit.name}</span>
							<span class="shrink-0 text-xs text-text-tertiary">{hp}%</span>
							<button onclick={() => habitsState.updateGoalLink(habit.id, null)} aria-label="Routine entkoppeln" class="shrink-0 text-text-tertiary hover:text-red-500">
								<X size={14} />
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			{#if unlinkedHabits.length > 0}
				<select onchange={linkHabit} class="min-h-11 w-full rounded-xl border border-border-color bg-surface-0 px-3 text-xs text-text-secondary focus:border-emerald-500 focus:outline-none">
					<option value="">+ Routine verknüpfen…</option>
					{#each unlinkedHabits as habit (habit.id)}
						<option value={habit.id}>{habit.name}</option>
					{/each}
				</select>
			{/if}
		</section>

		<!-- Universal-Links (Notizen, Termine, …) -->
		<section class="rounded-2xl border border-border-color bg-surface-0 p-4">
			<LinkedItems type="goal" id={goal.id} />
		</section>
	</div>
{/if}
