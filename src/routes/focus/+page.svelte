<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { rankTasks } from '$lib/features/dashboard/scoring';
	import { focusState } from '$lib/features/focus/store.svelte';
	import { timeTrackingState } from '$lib/features/timetracking/store.svelte';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			tasksState.load(id);
			goalsState.load(id);
			timeTrackingState.load();
		}
		focusState.loadToday();
	});
	onDestroy(() => {
		stopTimer();
		timeTrackingState.unload();
	});

	// ── Task-Queue ────────────────────────────────────────────────────
	const queue = $derived(rankTasks(tasksState.tasks));
	let currentIndex = $state(0);
	const currentTask = $derived(queue[currentIndex] ?? null);
	const linkedGoal = $derived(
		currentTask?.goal_id ? goalsState.goals.find((g) => g.id === currentTask.goal_id) : null
	);
	const remaining = $derived(queue.length - currentIndex);

	// ── Pomodoro-Timer ────────────────────────────────────────────────
	const WORK_SECONDS = 25 * 60;
	const BREAK_SECONDS = 5 * 60;

	let seconds = $state(WORK_SECONDS);
	let running = $state(false);
	let onBreak = $state(false);
	let intervalId: ReturnType<typeof setInterval> | null = null;

	function startTimer() {
		if (intervalId) return;
		running = true;
		intervalId = setInterval(() => {
			if (seconds > 0) {
				seconds--;
			} else {
				// Zeit abgelaufen
				stopTimer();
				if (onBreak) {
					onBreak = false;
					seconds = WORK_SECONDS;
				} else {
					focusState.increment();
					// Welle 3.3: abgeschlossene Fokus-Session als Zeiteintrag am Task speichern.
					void timeTrackingState.log(currentTask?.id ?? null, WORK_SECONDS / 60);
					onBreak = true;
					seconds = BREAK_SECONDS;
					startTimer(); // Pause startet automatisch
				}
			}
		}, 1000);
	}

	function stopTimer() {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
		running = false;
	}

	function resetTimer() {
		stopTimer();
		onBreak = false;
		seconds = WORK_SECONDS;
	}

	async function markDone() {
		if (!currentTask) return;
		await tasksState.setStatus(currentTask.id, 'done');
		resetTimer();
		// currentIndex bleibt, die Queue verkleinert sich reaktiv
	}

	function skipTask() {
		if (currentIndex < queue.length - 1) {
			currentIndex++;
		}
		resetTimer();
	}

	// Keyboard-Shortcuts
	function handleKeydown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
		if (e.key === ' ') {
			e.preventDefault();
			running ? stopTimer() : startTimer();
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			markDone();
		}
		if (e.key === 'ArrowRight') {
			e.preventDefault();
			skipTask();
		}
		if (e.key === 'Escape') {
			goto('/');
		}
	}

	// Timer-Anzeige
	const minutes = $derived(Math.floor(seconds / 60));
	const secs = $derived(seconds % 60);
	const timerDisplay = $derived(
		`${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
	);

	// Ring-Animation
	const TOTAL = $derived(onBreak ? BREAK_SECONDS : WORK_SECONDS);
	const RADIUS = 54;
	const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
	const ringOffset = $derived(CIRCUMFERENCE * (seconds / TOTAL));

	// Prioritäts-Farbe
	const priorityColor: Record<string, string> = {
		high: 'text-red-600',
		medium: 'text-amber-600',
		low: 'text-slate-500'
	};
	const priorityLabel: Record<string, string> = {
		high: 'Hoch',
		medium: 'Mittel',
		low: 'Niedrig'
	};
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Fokus - Life OS</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-4 py-8">
	{#if !currentTask}
		<!-- Alle Tasks erledigt -->
		<div class="flex flex-col items-center gap-4 text-center">
			<span class="text-6xl">🎉</span>
			<h1 class="text-2xl font-bold text-text-primary">Alles erledigt!</h1>
			<p class="text-text-secondary">Keine offenen Aufgaben mehr. Gönne dir eine Pause.</p>
			<a
				href="/"
				class="mt-2 rounded-xl bg-primary-600 px-6 py-3 font-medium text-white active:bg-primary-700"
			>
				Zum Dashboard
			</a>
		</div>
	{:else}
		<!-- Modus-Label -->
		<div class="mb-6 text-center">
			{#if onBreak}
				<span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
					>☕ Pause</span
				>
			{:else}
				<span class="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700"
					>🎯 Fokus</span
				>
			{/if}
			<p class="mt-1 text-xs text-text-tertiary">{remaining} Aufgabe{remaining !== 1 ? 'n' : ''} in der Queue</p>
			{#if timeTrackingState.totalTodayMin > 0}
				<p class="mt-0.5 text-xs text-text-tertiary">⏱ Heute {timeTrackingState.totalTodayMin} min fokussiert</p>
			{/if}
		</div>

		<!-- Timer-Ring -->
		<div class="relative mb-8 flex h-36 w-36 items-center justify-center">
			<svg class="-rotate-90" width="144" height="144" viewBox="0 0 144 144">
				<circle cx="72" cy="72" r={RADIUS} fill="none" stroke="var(--border-color)" stroke-width="8" />
				<circle
					cx="72"
					cy="72"
					r={RADIUS}
					fill="none"
					stroke={onBreak ? '#3b82f6' : '#4F46E5'}
					stroke-width="8"
					stroke-linecap="round"
					stroke-dasharray={CIRCUMFERENCE}
					stroke-dashoffset={ringOffset}
					class="transition-all duration-1000"
				/>
			</svg>
			<div class="absolute flex flex-col items-center">
				<span class="text-3xl font-bold tabular-nums text-text-primary">{timerDisplay}</span>
				{#if focusState.completedPomodoros > 0}
					<span class="text-xs text-text-tertiary">🍅 ×{focusState.completedPomodoros}</span>
				{/if}
			</div>
		</div>

		<!-- Task-Karte -->
		<div class="mb-8 w-full max-w-sm rounded-2xl border border-border-color bg-surface-0 p-5 shadow-sm">
			{#if linkedGoal}
				<p class="mb-2 text-xs font-medium text-primary-600">🎯 {linkedGoal.title}</p>
			{/if}
			<h2 class="text-xl font-semibold leading-snug text-text-primary">{currentTask.title}</h2>
			<div class="mt-3 flex items-center gap-3">
				<span class="text-xs font-medium {priorityColor[currentTask.priority]}">
					● {priorityLabel[currentTask.priority]}
				</span>
				{#if currentTask.due_at}
					<span class="text-xs text-text-tertiary">
						Fällig {new Date(currentTask.due_at).toLocaleDateString('de-DE')}
					</span>
				{/if}
				{#if timeTrackingState.totalForTask(currentTask.id) > 0}
					<span class="text-xs text-text-tertiary">⏱ {timeTrackingState.totalForTask(currentTask.id)} min</span>
				{/if}
			</div>
		</div>

		<!-- Steuer-Buttons -->
		<div class="flex w-full max-w-sm flex-col gap-3">
			<!-- Play/Pause -->
			<button
				onclick={() => (running ? stopTimer() : startTimer())}
				class="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary-600 text-lg font-medium text-white active:bg-primary-700"
			>
				{#if running}
					<span>⏸</span><span>Pause</span>
				{:else}
					<span>▶</span><span>Start</span>
				{/if}
			</button>

			<div class="flex gap-3">
				<!-- Erledigt -->
				<button
					onclick={markDone}
					class="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 text-sm font-medium text-primary-700 active:bg-primary-100"
				>
					✓ Erledigt
				</button>
				<!-- Überspringen -->
				<button
					onclick={skipTask}
					disabled={remaining <= 1}
					class="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border-color bg-surface-1 text-sm font-medium text-text-secondary active:bg-surface-2 disabled:opacity-40"
				>
					→ Weiter
				</button>
			</div>
		</div>

		<!-- Keyboard-Hints -->
		<p class="mt-6 text-center text-xs text-text-tertiary">
			<kbd class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-text-secondary border border-border-color">Space</kbd> Start/Pause ·
			<kbd class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-text-secondary border border-border-color">Enter</kbd> Erledigt ·
			<kbd class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-text-secondary border border-border-color">→</kbd> Weiter ·
			<kbd class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-text-secondary border border-border-color">Esc</kbd> zurück
		</p>
	{/if}
</div>
