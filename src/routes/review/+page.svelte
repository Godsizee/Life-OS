<script lang="ts">
	import { goto } from '$app/navigation';
	import { toISODate } from '$lib/core/date';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { reviewWeek } from '$lib/features/analytics/week-window';
	import { evaluateTrack } from '$lib/features/goals/checkins';
	import { getGoalProgress } from '$lib/features/goals/progress';
	import OnTrackBadge from '$lib/features/goals/components/OnTrackBadge.svelte';
	import { isDueOn, calculateStreak, isSkipped, isCompleted } from '$lib/features/habits/streak';
	import FocusStatsCard from '$lib/features/timetracking/components/FocusStatsCard.svelte';
	import Textarea from '$lib/ui/Textarea.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import { moodState } from '$lib/features/mood/store.svelte';
	import { healthState } from '$lib/features/health/store.svelte';
	import { activityLabel } from '$lib/features/mood/activities';
	import { averageScore, activityStats, formatScore } from '$lib/features/mood/stats';
	import { goalHitDays, metricAverage, formatMetric } from '$lib/features/health/stats';

	// Laden/Entladen liegt zentral in core/workspace-data.ts (+layout.svelte).
	// Nur die Satz-Historie ist bewusst lazy und wird hier angestoßen.
	$effect(() => {
		if (fitnessState.loaded) void fitnessState.loadAllSetLogs();
	});

	// ── Wochen-Statistiken ────────────────────────────────────────────
	// Der Tick sorgt dafür, dass das Fenster über Mitternacht mitwandert, statt
	// beim Erzeugen der Komponente einzufrieren.
	let heute = $state(new Date());
	$effect(() => {
		const timer = setInterval(() => (heute = new Date()), 60_000);
		return () => clearInterval(timer);
	});

	const week = $derived(reviewWeek(heute));
	const weekStart = $derived(week.start);
	const weekEnd = $derived(week.end);
	const weekDates = $derived(week.dates);

	function isoDate(d: Date) { return toISODate(d); }

	const doneTasks = $derived(
		tasksState.tasks.filter(
			(t) => t.status === 'done' && t.updated_at >= isoDate(weekStart)
		)
	);

	// Habit-Adherence: wie viele Due-Tage wurden geloggt
	const habitStats = $derived(
		habitsState.habits.map((h) => {
			const days = habitsState.entriesFor(h.id);
			let dueDays = 0;
			let loggedDays = 0;
			for (const dStr of weekDates) {
				const day = days.find((d) => d.date === dStr);
				if (isSkipped(day)) continue;
				if (h.schedule.type === 'weekly_count' || isDueOn(h.schedule, new Date(dStr))) {
					dueDays++;
					if (isCompleted(h, day)) loggedDays++;
				}
			}
			const pct = dueDays > 0 ? Math.round((loggedDays / dueDays) * 100) : 100;
			const streak = calculateStreak(h, days);
			return { habit: h, dueDays, loggedDays, pct, streak };
		})
	);

	const avgAdherence = $derived(
		habitStats.length > 0
			? Math.round(habitStats.reduce((s, h) => s + h.pct, 0) / habitStats.length)
			: 0
	);

	const goalsInProgress = $derived(goalsState.goals.filter((g) => g.status !== 'done'));

	// Trainings-Block (Welle F4)
	const weekWorkouts = $derived(
		fitnessState.logs.filter((l) => l.date >= isoDate(weekStart))
	);
	const weekVolumeKg = $derived(
		Math.round(
			fitnessState.allSetLogs
				.filter((s) => s.date >= isoDate(weekStart) && s.weight_kg && s.reps)
				.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0)
		)
	);
	const weekPRs = $derived(
		fitnessState.records.filter((r) => toISODate(new Date(r.achieved_at)) >= isoDate(weekStart))
	);

	const weekMoods = $derived(moodState.entries.filter((m) => m.date >= isoDate(weekStart)));
	const weekMoodAvg = $derived(averageScore(weekMoods));
	const weekTopActivities = $derived(activityStats(weekMoods, 2).slice(0, 3));
	const weekSleepAvg = $derived(metricAverage(healthState.entries, 'sleep_h', 7));
	const weekWaterHit = $derived(
		goalHitDays(healthState.entries, 'water_ml', profileState.waterGoalMl, 7)
	);

	// Nächste Woche Top-3 (aus offenen Tasks wählen)
	const openTasks = $derived(tasksState.tasks.filter((t) => t.status !== 'done' && !t.parent_id));

	// ── Wizard-State ──────────────────────────────────────────────────
	let step = $state(1); // 1 = Rückblick, 2 = Ausblick, 3 = Reflexion
	const TOTAL_STEPS = 3;

	// Schritt 3: Reflexion
	let reflGood = $state('');
	let reflHard = $state('');
	let reflChange = $state('');

	// Schritt 2: Top-3 für nächste Woche
	let selectedNextTasks = $state<string[]>([]);
	function toggleNextTask(id: string) {
		if (selectedNextTasks.includes(id)) {
			selectedNextTasks = selectedNextTasks.filter((i) => i !== id);
		} else if (selectedNextTasks.length < 3) {
			selectedNextTasks = [...selectedNextTasks, id];
		}
	}

	// Speichern
	let saving = $state(false);
	async function finish() {
		saving = true;
		try {
			const body = [
				reflGood ? `## Was lief gut\n${reflGood}` : '',
				reflHard ? `## Was war schwer\n${reflHard}` : '',
				reflChange ? `## Was ändere ich\n${reflChange}` : '',
				selectedNextTasks.length > 0
					? `## Top-3 nächste Woche\n${selectedNextTasks
							.map((id) => openTasks.find((t) => t.id === id)?.title ?? id)
							.map((t) => `- ${t}`)
							.join('\n')}`
					: ''
			]
				.filter(Boolean)
				.join('\n\n');

			// Datum beim Speichern frisch bilden, nicht aus dem Render-Tick.
			await goalsState.saveJournalEntry(
				toISODate(new Date()),
				'📋',
				body || '(Kein Text)',
				null,
				'weekly'
			);
			goto('/');
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Weekly Review - Life OS</title>
</svelte:head>

<!-- Progress-Bar -->
<div class="mb-6">
	<div class="mb-2 flex items-center justify-between">
		<h1 class="text-2xl font-bold tracking-tight text-text-primary">📋 Weekly Review</h1>
		<span class="text-sm text-text-secondary">{step}/{TOTAL_STEPS}</span>
	</div>
	<div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
		<div
			class="h-full bg-primary-500 transition-all duration-500"
			style="width: {(step / TOTAL_STEPS) * 100}%"
		></div>
	</div>
</div>

<!-- ── Schritt 1: Rückblick ── -->
{#if step === 1}
	<section class="flex flex-col gap-4">
		<h2 class="text-lg font-semibold text-text-primary">Diese Woche im Rückblick</h2>

		<!-- Tasks erledigt -->
		<div class="rounded-xl border border-border-color bg-surface-0 p-4">
			<p class="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Erledigte Aufgaben</p>
			{#if doneTasks.length === 0}
				<p class="mt-2 text-sm text-text-secondary">Keine Aufgaben als erledigt markiert diese Woche.</p>
			{:else}
				<p class="mt-1 text-2xl font-bold text-primary-600">{doneTasks.length}</p>
				<ul class="mt-2 flex flex-col gap-1">
					{#each doneTasks.slice(0, 5) as task (task.id)}
						<li class="flex items-center gap-2 text-sm text-text-secondary">
							<span class="text-primary-500">✓</span>
							<span class="truncate">{task.title}</span>
						</li>
					{/each}
					{#if doneTasks.length > 5}
						<li class="text-xs text-text-tertiary">+{doneTasks.length - 5} weitere</li>
					{/if}
				</ul>
			{/if}
		</div>

		<!-- Habit-Adherence -->
		<div class="rounded-xl border border-border-color bg-surface-0 p-4">
			<p class="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Gewohnheiten</p>
			<p class="mt-1 text-2xl font-bold {avgAdherence >= 70 ? 'text-primary-600' : avgAdherence >= 40 ? 'text-amber-600' : 'text-red-500'}">{avgAdherence}%</p>
			<p class="text-xs text-text-secondary">Durchschnittliche Einhaltung</p>
			{#if habitStats.length > 0}
				<div class="mt-3 flex flex-col gap-2">
					{#each habitStats as { habit, loggedDays, dueDays, pct, streak } (habit.id)}
						<div class="flex items-center gap-2">
							<span class="w-32 truncate text-xs text-text-secondary">{habit.name}</span>
							<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
								<div class="h-full bg-primary-500" style="width: {pct}%"></div>
							</div>
							<span class="w-12 text-right text-xs text-text-secondary">{loggedDays}/{dueDays}</span>
							{#if streak >= 3}
								<span class="text-xs">🔥{streak}</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Training (Welle F4) -->
		<div class="rounded-xl border border-border-color bg-surface-0 p-4">
			<p class="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Training</p>
			{#if weekWorkouts.length === 0}
				<p class="mt-2 text-sm text-text-secondary">Kein Workout diese Woche geloggt.</p>
			{:else}
				<p class="mt-1 text-2xl font-bold text-primary-600">{weekWorkouts.length}</p>
				<p class="text-xs text-text-secondary">
					Workout{weekWorkouts.length !== 1 ? 's' : ''} · {weekVolumeKg.toLocaleString('de-DE')} kg Volumen
					{#if weekPRs.length > 0}· 🏆 {weekPRs.length} PR{weekPRs.length !== 1 ? 's' : ''}{/if}
				</p>
			{/if}
		</div>

		<!-- Stimmung & Gesundheit (W9) -->
		<div class="rounded-xl border border-border-color bg-surface-0 p-4">
			<p class="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Stimmung & Gesundheit</p>
			{#if weekMoods.length === 0}
				<p class="mt-2 text-sm text-text-secondary">Keine Stimmung erfasst diese Woche.</p>
			{:else}
				<p class="mt-1 text-2xl font-bold text-primary-600">{formatScore(weekMoodAvg)}</p>
				<p class="text-xs text-text-secondary">
					Ø-Stimmung über {weekMoods.length} Tag{weekMoods.length !== 1 ? 'e' : ''}
				</p>
				{#if weekTopActivities.length > 0}
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each weekTopActivities as stat (stat.id)}
							<span class="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-secondary">
								{activityLabel(stat.id)} · {stat.count}x
							</span>
						{/each}
					</div>
				{/if}
			{/if}
			<div class="mt-3 flex flex-wrap gap-3 border-t border-border-color/40 pt-3 text-xs text-text-secondary">
				<span>😴 Ø {formatMetric('sleep_h', weekSleepAvg)}</span>
				<span>💧 Ziel an {weekWaterHit.hit}/{weekWaterHit.tracked} Tagen</span>
			</div>
		</div>

		<!-- Fokuszeit (W6) -->
		<FocusStatsCard title="Fokuszeit diese Woche" />

		<!-- Ziele-Übersicht -->
		{#if goalsInProgress.length > 0}
			<div class="rounded-xl border border-border-color bg-surface-0 p-4">
				<p class="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Ziele</p>
				<div class="mt-2 flex flex-col gap-2">
					{#each goalsInProgress as goal (goal.id)}
						{@const progress = getGoalProgress(goal)}
						{@const track = evaluateTrack(goal, progress)}
						<div class="flex items-center gap-2">
							<span class="min-w-0 flex-1 truncate text-sm text-text-secondary">{goal.title}</span>
							<OnTrackBadge {track} compact />
							<div class="w-16 flex-shrink-0">
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
									<div class="h-full bg-primary-500" style="width: {progress}%"></div>
								</div>
							</div>
							<span class="w-8 text-right text-xs text-text-secondary">{progress}%</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<button
			onclick={() => step++}
			class="mt-2 min-h-12 rounded-xl bg-primary-600 text-sm font-medium text-white active:bg-primary-700"
		>
			Weiter →
		</button>
	</section>

<!-- ── Schritt 2: Ausblick ── -->
{:else if step === 2}
	<section class="flex flex-col gap-4">
		<div>
			<h2 class="text-lg font-semibold text-text-primary">Nächste Woche</h2>
			<p class="mt-1 text-sm text-text-secondary">Wähle deine Top-3 Aufgaben für die nächste Woche.</p>
		</div>

		{#if openTasks.length === 0}
			<p class="rounded-xl border border-border-color bg-surface-0 p-4 text-sm text-text-secondary">
				Keine offenen Aufgaben — sieht gut aus! 🎉
			</p>
		{:else}
			<ul class="flex flex-col gap-2">
				{#each openTasks.slice(0, 15) as task (task.id)}
					{@const isSelected = selectedNextTasks.includes(task.id)}
					<li>
						<button
							onclick={() => toggleNextTask(task.id)}
							disabled={!isSelected && selectedNextTasks.length >= 3}
							class="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors
								{isSelected
								? 'border-primary-400 bg-primary-50 dark:bg-primary-950/20'
								: 'border-border-color bg-surface-0'}
								disabled:opacity-40"
						>
							<span
								class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors
									{isSelected ? 'border-primary-500 bg-primary-500 text-white' : 'border-border-color'}"
							>
								{#if isSelected}✓{/if}
							</span>
							<span class="min-w-0 flex-1 text-sm text-text-primary">{task.title}</span>
							{#if task.priority === 'high'}
								<span class="shrink-0 text-xs font-medium text-red-500">!</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
			{#if openTasks.length > 15}
				<p class="text-xs text-text-tertiary">Nur die ersten 15 angezeigt — ggf. Tasks priorisieren.</p>
			{/if}
		{/if}

		<p class="text-center text-sm text-text-secondary">
			{selectedNextTasks.length}/3 ausgewählt
		</p>

		<div class="flex gap-3">
			<button
				onclick={() => step--}
				class="min-h-12 flex-1 rounded-xl border border-border-color bg-surface-0 text-sm font-medium text-text-secondary hover:bg-surface-1"
			>
				← Zurück
			</button>
			<button
				onclick={() => step++}
				class="min-h-12 flex-1 rounded-xl bg-primary-600 text-sm font-medium text-white active:bg-primary-700"
			>
				Weiter →
			</button>
		</div>
	</section>

<!-- ── Schritt 3: Reflexion ── -->
{:else if step === 3}
	<section class="flex flex-col gap-4">
		<div>
			<h2 class="text-lg font-semibold text-text-primary">Reflexion</h2>
			<p class="mt-1 text-sm text-text-secondary">3 kurze Fragen — du musst nicht alle beantworten.</p>
		</div>

		<label class="flex flex-col gap-1.5">
			<span class="text-sm font-medium text-text-secondary">🌟 Was lief diese Woche gut?</span>
			<Textarea bind:value={reflGood} rows={3} placeholder="z.B. Alle Habits eingehalten, ein schwieriges Gespräch geführt…" />
		</label>

		<label class="flex flex-col gap-1.5">
			<span class="text-sm font-medium text-text-secondary">💪 Was war schwer oder hat nicht geklappt?</span>
			<Textarea bind:value={reflHard} rows={3} placeholder="z.B. Ablenkungen, zu viele Aufgaben auf einmal…" />
		</label>

		<label class="flex flex-col gap-1.5">
			<span class="text-sm font-medium text-text-secondary">🔄 Was ändere ich nächste Woche?</span>
			<Textarea bind:value={reflChange} rows={3} placeholder="z.B. Früher schlafen, täglich 1 Priorität setzen…" />
		</label>

		<div class="flex gap-3">
			<button
				onclick={() => step--}
				class="min-h-12 flex-1 rounded-xl border border-border-color bg-surface-0 text-sm font-medium text-text-secondary hover:bg-surface-1"
			>
				← Zurück
			</button>
			<button
				onclick={finish}
				disabled={saving}
				class="min-h-12 flex-1 rounded-xl bg-primary-600 text-sm font-medium text-white active:bg-primary-700 disabled:opacity-60"
			>
				{saving ? 'Speichere…' : '✓ Abschließen'}
			</button>
		</div>
	</section>
{/if}
