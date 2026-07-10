<script lang="ts">
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { calendarState } from '$lib/features/calendar/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { isDueOn } from '$lib/features/habits/streak';
	import { rankTasks } from '$lib/features/dashboard/scoring';
	import { toISODate } from '$lib/core/date';
	import { X, Sun } from 'lucide-svelte';

	const today = toISODate(new Date());
	const LS_KEY = `lifeos:brief:${today}`;

	// Nur beim ersten Öffnen des Tages zeigen.
	let dismissed = $state(true);
	$effect(() => {
		try {
			dismissed = localStorage.getItem(LS_KEY) === '1';
		} catch {
			dismissed = false;
		}
	});

	function dismiss() {
		dismissed = true;
		try {
			localStorage.setItem(LS_KEY, '1');
		} catch {}
	}

	const todayEvents = $derived(
		calendarState.events
			.filter((e) => toISODate(new Date(e.start)) === today)
			.sort((a, b) => a.start.localeCompare(b.start))
	);
	const topTasks = $derived(rankTasks(tasksState.tasks).slice(0, 3));
	const dueHabits = $derived(
		habitsState.habits.filter(
			(h) => !h.archived && isDueOn(h.schedule, new Date()) && !habitsState.isLoggedToday(h.id)
		)
	);
	const lastWorkout = $derived(fitnessState.logs[0]?.date ?? null);
	const workoutStale = $derived.by(() => {
		if (fitnessState.plans.length === 0) return false;
		if (!lastWorkout) return true;
		const four = new Date();
		four.setDate(four.getDate() - 4);
		return new Date(lastWorkout) < four;
	});

	const hasContent = $derived(
		todayEvents.length > 0 || topTasks.length > 0 || dueHabits.length > 0 || workoutStale
	);
</script>

{#if !dismissed && hasContent}
	<section class="rounded-2xl border border-primary-active/20 bg-primary-active-bg/40 p-4 premium-shadow">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="flex items-center gap-2 text-sm font-bold text-text-primary">
				<Sun size={16} class="text-amber-500" /> Dein Tag
			</h2>
			<button onclick={dismiss} aria-label="Ausblenden" class="text-text-tertiary hover:text-text-primary">
				<X size={16} />
			</button>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<!-- Termine -->
			<div>
				<p class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Termine</p>
				{#if todayEvents.length > 0}
					<ul class="mt-1 space-y-0.5">
						{#each todayEvents.slice(0, 3) as e (e.id)}
							<li class="truncate text-sm text-text-secondary">
								{e.all_day
									? 'Ganztägig'
									: new Date(e.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · {e.title}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-1 text-sm text-text-tertiary">Keine Termine.</p>
				{/if}
			</div>

			<!-- Top-Aufgaben -->
			<div>
				<p class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Fokus heute</p>
				{#if topTasks.length > 0}
					<ul class="mt-1 space-y-0.5">
						{#each topTasks as t (t.id)}
							<li class="truncate text-sm text-text-secondary">○ {t.title}</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-1 text-sm text-text-tertiary">Keine offenen Aufgaben.</p>
				{/if}
			</div>
		</div>

		<div class="mt-3 flex flex-wrap gap-2 border-t border-border-color/40 pt-3 text-xs">
			{#if dueHabits.length > 0}
				<span class="rounded-full bg-surface-2 px-2.5 py-1 font-medium text-text-secondary">
					🔁 {dueHabits.length} Routine{dueHabits.length !== 1 ? 'n' : ''} offen
				</span>
			{/if}
			{#if workoutStale}
				<a href="/fitness" class="rounded-full bg-surface-2 px-2.5 py-1 font-medium text-text-secondary hover:text-text-primary">
					🏋️ Training fällig
				</a>
			{/if}
		</div>
	</section>
{/if}
