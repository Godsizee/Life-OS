<script lang="ts">
	import { goto } from '$app/navigation';
	import { toISODate, fromISODate } from '$lib/core/date';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { habitsState } from '$lib/features/habits/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { moodState } from '$lib/features/mood/store.svelte';
	import { healthState } from '$lib/features/health/store.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import { timeTrackingState } from '$lib/features/timetracking/store.svelte';
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { reviewWeek, nextWeekKey } from '$lib/features/analytics/week-window';
	import { wochenKennzahlen, type WochenQuellen } from '$lib/features/analytics/week-stats';
	import StepRueckblick from './StepRueckblick.svelte';
	import StepAusblick from './StepAusblick.svelte';
	import StepReflexion from './StepReflexion.svelte';

	// Laden/Entladen liegt zentral in core/workspace-data.ts (+layout.svelte).
	// Nur die Satz-Historie ist bewusst lazy und wird hier angestoßen.
	$effect(() => {
		if (fitnessState.loaded) void fitnessState.loadAllSetLogs();
	});

	// Der Tick sorgt dafür, dass das Fenster über Mitternacht mitwandert.
	let heute = $state(new Date());
	$effect(() => {
		const timer = setInterval(() => (heute = new Date()), 60_000);
		return () => clearInterval(timer);
	});

	const week = $derived(reviewWeek(heute));
	const vorwoche = $derived.by(() => {
		const d = new Date(heute);
		d.setDate(d.getDate() - 7);
		return reviewWeek(d);
	});

	const quellen = $derived<WochenQuellen>({
		tasks: tasksState.tasks,
		habits: habitsState.habits,
		habitDays: (id) => habitsState.entriesFor(id),
		workouts: fitnessState.logs,
		setLogs: fitnessState.allSetLogs,
		moods: moodState.entries,
		health: healthState.entries,
		focusEntries: timeTrackingState.entries,
		waterGoalMl: profileState.waterGoalMl,
		lifeScores: analyticsState.scores
	});
	const kennzahlen = $derived(wochenKennzahlen(quellen, week, vorwoche));

	const focusLetzteWoche = $derived(tasksState.focusTasks);
	const goalsInProgress = $derived(goalsState.goals.filter((g) => g.status !== 'done'));
	const openTasks = $derived(tasksState.tasks.filter((t) => t.status !== 'done' && !t.parent_id));

	const letzterReview = $derived(
		[...goalsState.journalEntries]
			.filter((j) => j.kind === 'weekly')
			.sort((a, b) => b.date.localeCompare(a.date))[0]
	);
	const tageSeitReview = $derived.by(() => {
		const d = letzterReview ? fromISODate(letzterReview.date) : null;
		return d ? Math.round((week.end.getTime() - d.getTime()) / 86_400_000) : null;
	});

	// ── Wizard-State ──────────────────────────────────────────────────
	let step = $state(1); // 1 = Rückblick, 2 = Ausblick, 3 = Reflexion
	const TOTAL_STEPS = 3;

	let reflGood = $state('');
	let reflHard = $state('');
	let reflChange = $state('');

	let selectedNextTasks = $state<string[]>([]);
	function toggleNextTask(id: string) {
		if (selectedNextTasks.includes(id)) {
			selectedNextTasks = selectedNextTasks.filter((i) => i !== id);
		} else if (selectedNextTasks.length < 3) {
			selectedNextTasks = [...selectedNextTasks, id];
		}
	}

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
			await goalsState.saveJournalEntry(toISODate(new Date()), '📋', body || '(Kein Text)', null, 'weekly');

			// W10 — Top-3 wirksam machen: als Wochenfokus für die kommende Woche markieren.
			const kommendeWoche = nextWeekKey(new Date());
			for (const id of selectedNextTasks) {
				await tasksState.setFocusWeek(id, kommendeWoche);
			}
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

{#if step === 1}
	<StepRueckblick {kennzahlen} {focusLetzteWoche} {goalsInProgress} {letzterReview} {tageSeitReview} onNext={() => step++} />
{:else if step === 2}
	<StepAusblick {openTasks} selected={selectedNextTasks} onToggle={toggleNextTask} onBack={() => step--} onNext={() => step++} />
{:else if step === 3}
	<StepReflexion bind:reflGood bind:reflHard bind:reflChange {saving} onBack={() => step--} onFinish={finish} />
{/if}
