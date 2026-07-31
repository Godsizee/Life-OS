<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { getGoalProgress } from '$lib/features/goals/progress';
	import { calculateHabitProgress30Days } from '$lib/features/habits/streak';
	import { workoutsThisWeek } from '$lib/features/fitness/utils/frequency';
	import { evaluateTrack } from '$lib/features/goals/checkins';
	import LinkedItems from '$lib/features/links/components/LinkedItems.svelte';
	import GoalTargetCard from '$lib/features/goals/components/GoalTargetCard.svelte';
	import GoalForm from '$lib/features/goals/components/GoalForm.svelte';
	import OnTrackBadge from '$lib/features/goals/components/OnTrackBadge.svelte';
	import CheckCircle from '$lib/ui/CheckCircle.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import { ArrowLeft, Trash2, X, Dumbbell, CalendarCheck, Archive, ArchiveRestore } from 'lucide-svelte';
	import Select from '$lib/ui/Select.svelte';
	import EmptyState from '$lib/ui/EmptyState.svelte';
	import type { GoalStatus } from '$lib/features/goals/types';

	const goalId = $derived(page.params.id);

	let meilensteinOffen = $state(false);

	// Laden/Entladen liegt zentral in core/workspace-data.ts (+layout.svelte).
	const goal = $derived(goalsState.goals.find((g) => g.id === goalId) ?? null);
	const progress = $derived(goal ? getGoalProgress(goal) : 0);
	const track = $derived(goal ? evaluateTrack(goal, progress) : null);

	const unterziele = $derived(goalsState.goals.filter((g) => g.parent_id === goalId && !g.archived));
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
	const weeklyCount = $derived(goal?.goal_type === 'fitness_frequency' ? workoutsThisWeek(fitnessState.logs) : 0);

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
		if (!confirm('Ziel endgültig löschen? Alle Check-ins werden ebenfalls gelöscht.')) return;
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
	{#if goalsState.loading}
		<div class="rounded-2xl border border-border-color bg-surface-0 p-8 text-center text-text-secondary">
			Lade Ziel…
		</div>
	{:else}
		<EmptyState title="Ziel nicht gefunden." />
	{/if}
{:else}
	<div class="space-y-6">
		<!-- Kopf -->
		<header class="space-y-3">
			<div class="flex items-start justify-between gap-3">
				<h1 class="text-2xl font-bold tracking-tight text-text-primary">{goal.title}</h1>
				<div class="flex items-center gap-2 shrink-0">
					{#if goal.archived}
						<button onclick={() => goalsState.unarchiveGoal(goal.id)} aria-label="Wiederherstellen" class="flex items-center gap-1 text-xs font-medium text-primary-active hover:underline">
							<ArchiveRestore size={16} /> Wiederherstellen
						</button>
					{:else}
						<button onclick={() => goalsState.archiveGoal(goal.id)} aria-label="Ziel archivieren" class="text-text-tertiary hover:text-text-primary" title="Archivieren">
							<Archive size={18} />
						</button>
					{/if}
					<button onclick={removeGoal} aria-label="Ziel löschen" class="text-text-tertiary hover:text-red-500" title="Endgültig löschen">
						<Trash2 size={18} />
					</button>
				</div>
			</div>
			{#if goal.description}
				<p class="text-sm text-text-secondary">{goal.description}</p>
			{/if}

			<!-- Fortschritt -->
			<div class="space-y-1.5">
				<div class="flex items-center justify-between text-xs">
					<span class="font-semibold text-text-primary">{progress}%</span>
					{#if goal.target_date}
						<div class="flex items-center gap-2 text-text-tertiary">
							<span>Zieldatum: {new Date(goal.target_date).toLocaleDateString('de-DE')}</span>
							{#if track && track.state !== 'no_date' && track.state !== 'done'}
								<span class="font-medium {track.daysLeft < 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-text-tertiary'}">
									({track.daysLeft > 0 ? `noch ${track.daysLeft} Tage` : track.daysLeft === 0 ? 'heute fällig' : `${-track.daysLeft} Tage überfällig`})
								</span>
							{/if}
						</div>
					{/if}
				</div>
				<div class="h-2.5 w-full overflow-hidden rounded-full bg-surface-2 border border-border-color/20">
					<div class="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-500" style="width: {progress}%"></div>
				</div>
				{#if track}
					<div class="mt-2">
						<OnTrackBadge {track} />
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				<Select value={goal.status} onchange={(e) => goalsState.setStatus(goal.id, e.currentTarget.value as GoalStatus)}>
					{#each Object.entries(statusLabel) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</Select>
			</div>
		</header>

		<!-- Meilensteine -->
		<section class="space-y-2">
			<div class="flex items-center justify-between">
				<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Meilensteine</h2>
				<button onclick={() => (meilensteinOffen = true)} class="text-xs font-medium text-primary-active hover:underline">
					+ Meilenstein
				</button>
			</div>
			{#if unterziele.length > 0}
				<ul class="flex flex-col gap-1.5">
					{#each unterziele as u (u.id)}
						{@const p = getGoalProgress(u)}
						<li class="flex items-center gap-2 rounded-lg border border-border-color bg-surface-1 px-2.5 py-1.5">
							<CheckCircle checked={u.status === 'done'} ontoggle={() => goalsState.setStatus(u.id, u.status === 'done' ? 'open' : 'done')} />
							<a href="/goals/{u.id}" class="min-w-0 flex-1 truncate text-sm text-text-primary">{u.title}</a>
							<span class="shrink-0 text-xs text-text-tertiary">{p}%</span>
						</li>
					{/each}
				</ul>
				<p class="text-[11px] text-text-tertiary">
					Der Fortschritt dieses Ziels ergibt sich aus seinen Meilensteinen.
				</p>
			{/if}
		</section>

		<!-- Zielwert (W8) -->
		{#if goal.goal_type === 'target'}
			<GoalTargetCard {goal} />
		{/if}

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

		<!-- Frequenz-Ziel -->
		{#if goal.goal_type === 'fitness_frequency' && goal.target_value}
			<section class="rounded-2xl border border-border-color bg-surface-0 p-4">
				<h2 class="mb-2 flex items-center gap-1.5 text-sm font-bold text-text-primary">
					<CalendarCheck size={16} /> Trainings-Frequenz
				</h2>
				<div class="flex items-baseline justify-between text-sm">
					<span class="text-text-secondary">Diese Woche</span>
					<span class="font-mono text-text-primary">{weeklyCount} / {goal.target_value}×</span>
				</div>
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
				<Select onchange={linkTask}>
					<option value="">+ Aufgabe verknüpfen…</option>
					{#each unlinkedTasks as task (task.id)}
						<option value={task.id}>{task.title}</option>
					{/each}
				</Select>
			{/if}
		</section>

		<!-- Verknüpfte Routinen -->
		<section class="space-y-2">
			<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Routinen</h2>
			{#if linkedHabits.length > 0}
				<ul class="flex flex-col gap-1.5">
					{#each linkedHabits as habit (habit.id)}
						{@const hp = calculateHabitProgress30Days(habit, habitsState.entriesFor(habit.id))}
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
				<Select onchange={linkHabit}>
					<option value="">+ Routine verknüpfen…</option>
					{#each unlinkedHabits as habit (habit.id)}
						<option value={habit.id}>{habit.name}</option>
					{/each}
				</Select>
			{/if}
		</section>

		<!-- Universal-Links (Notizen, Termine, …) -->
		<section class="rounded-2xl border border-border-color bg-surface-0 p-4">
			<LinkedItems type="goal" id={goal.id} />
		</section>
	</div>

	<Sheet bind:open={meilensteinOffen} title="Neuer Meilenstein">
		<GoalForm parentId={goal.id} onsubmitted={() => (meilensteinOffen = false)} />
	</Sheet>
{/if}
