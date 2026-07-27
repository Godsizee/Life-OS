<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { tasksState } from '$lib/features/tasks/store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import { timeTrackingState } from '$lib/features/timetracking/store.svelte';
	import { focusSession } from '$lib/features/focus/session.svelte';
	import { phaseLabel, roundLabel } from '$lib/features/focus/session-logic';
	import { formatMinutes } from '$lib/features/timetracking/stats';
	import { rankTasks } from '$lib/features/dashboard/scoring';
	import FocusRing from '$lib/features/focus/components/FocusRing.svelte';
	import FocusSettingsSheet from '$lib/features/focus/components/FocusSettingsSheet.svelte';
	import TimeEntryForm from '$lib/features/timetracking/components/TimeEntryForm.svelte';
	import Sheet from '$lib/ui/Sheet.svelte';
	import { Check, ChevronRight, Pause, Play, Plus, RotateCcw, Settings, SkipForward } from 'lucide-svelte';

	let settingsOpen = $state(false);
	let manualOpen = $state(false);

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			tasksState.load(id);
			goalsState.load(id);
			// Erst laden, dann restaurieren: settle() braucht die Runden von heute.
			void timeTrackingState.load().then(() => focusSession.restore());
		}
	});
	// Die Session wird NICHT beendet — sie soll Navigation überleben (W6-Kern).
	onDestroy(() => {
		timeTrackingState.unload();
	});

	// ── Task-Queue ────────────────────────────────────────────────────
	const queue = $derived(rankTasks(tasksState.tasks));
	let currentIndex = $state(0);
	const currentTask = $derived(queue[currentIndex] ?? null);
	const linkedGoal = $derived(
		currentTask?.goal_id ? goalsState.goals.find((g) => g.id === currentTask.goal_id) : null
	);
	const remainingInQueue = $derived(Math.max(0, queue.length - currentIndex));

	// Die Session hält ihre eigene Aufgabe fest; die Queue darf sie nicht überschreiben,
	// solange eine Phase läuft.
	$effect(() => {
		if (!focusSession.active && currentTask?.id && focusSession.taskId !== currentTask.id) {
			focusSession.setTask(currentTask.id);
		}
	});
	const sessionTask = $derived(
		focusSession.taskId ? (tasksState.tasks.find((t) => t.id === focusSession.taskId) ?? null) : null
	);

	// ── Sekunden-Tick (Muster fitness/+page.svelte:79-97) ─────────────
	let tick = $state(0);
	$effect(() => {
		if (!focusSession.running) return;
		const interval = setInterval(() => {
			tick += 1;
			void focusSession.settle();
		}, 1000);
		return () => clearInterval(interval);
	});
	const clock = $derived.by(() => {
		tick;
		return focusSession.clock();
	});
	const progress = $derived.by(() => {
		tick;
		return focusSession.progress();
	});

	const pomodorosToday = $derived(timeTrackingState.pomodoroCountToday);
	const caption = $derived(
		focusSession.isFocus ? roundLabel(pomodorosToday, {
			focusMinutes: profileState.focusMinutes,
			breakMinutes: profileState.focusBreakMinutes,
			longBreakMinutes: profileState.focusLongBreakMinutes,
			roundsUntilLongBreak: profileState.focusRoundsUntilLongBreak
		}) : ''
	);

	// Restzeit im Tab-Titel — ersetzt Web-Push und macht den App-Wechsel nutzbar.
	const pageTitle = $derived(
		focusSession.active
			? `${clock} ${focusSession.isFocus ? '🎯' : '☕'} Fokus – Life OS`
			: 'Fokus – Life OS'
	);

	async function markDone() {
		if (!currentTask) return;
		await tasksState.setStatus(currentTask.id, 'done');
		focusSession.reset();
	}

	function skipTask() {
		if (currentIndex < queue.length - 1) currentIndex++;
		if (!focusSession.active) focusSession.setTask(queue[currentIndex]?.id ?? null);
	}

	function pickTask(index: number) {
		currentIndex = index;
		if (!focusSession.active) focusSession.setTask(queue[index]?.id ?? null);
	}

	// Keyboard-Shortcuts
	function handleKeydown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
		if (settingsOpen || manualOpen) return;
		if (e.key === ' ') {
			e.preventDefault();
			focusSession.toggle(currentTask?.id ?? null);
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			void markDone();
		}
		if (e.key === 'ArrowRight') {
			e.preventDefault();
			skipTask();
		}
		if (e.key === 'Escape') void goto('/');
	}

	const priorityColor: Record<string, string> = {
		high: 'text-red-600',
		medium: 'text-amber-600',
		low: 'text-slate-500'
	};
	const priorityLabel: Record<string, string> = { high: 'Hoch', medium: 'Mittel', low: 'Niedrig' };
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-4 py-6">
	<!-- Kopfzeile: Statistik + Einstellungen -->
	<div class="mb-6 flex items-center justify-between gap-3">
		<div class="min-w-0">
			<p class="text-xs font-bold uppercase tracking-wider text-text-tertiary">
				{phaseLabel(focusSession.phase)}
			</p>
			<p class="truncate text-sm text-text-secondary">
				⏱ Heute {formatMinutes(timeTrackingState.totalTodayMin)}
				{#if pomodorosToday > 0}· 🍅 ×{pomodorosToday}{/if}
				· Woche {formatMinutes(timeTrackingState.totalWeekMin)}
			</p>
		</div>
		<div class="flex shrink-0 items-center gap-1">
			<button
				onclick={() => (manualOpen = true)}
				aria-label="Zeit nachtragen"
				class="flex h-12 w-12 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-2 active:scale-95"
			>
				<Plus size={20} />
			</button>
			<button
				onclick={() => (settingsOpen = true)}
				aria-label="Fokus-Einstellungen"
				class="flex h-12 w-12 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-2 active:scale-95"
			>
				<Settings size={20} />
			</button>
		</div>
	</div>

	<div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
		<!-- ── Timer-Spalte ── -->
		<section class="flex flex-col items-center">
			<!-- Modus-Label -->
			<div class="mb-4 text-center">
				{#if focusSession.isBreak}
					<span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
						☕ {phaseLabel(focusSession.phase)}
					</span>
				{:else}
					<span class="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
						🎯 Fokus
					</span>
				{/if}
				{#if focusSession.paused}
					<p class="mt-1 text-xs text-amber-600">pausiert</p>
				{/if}
			</div>

			<FocusRing
				{progress}
				{clock}
				{caption}
				accent={focusSession.isBreak ? 'break' : 'focus'}
			/>

			<!-- Aufgaben-Karte -->
			<div class="mt-8 w-full max-w-sm rounded-2xl border border-border-color bg-surface-0 p-5 premium-shadow">
				{#if sessionTask ?? currentTask}
					{@const task = sessionTask ?? currentTask}
					{#if linkedGoal && task?.id === currentTask?.id}
						<p class="mb-2 text-xs font-medium text-primary-600 dark:text-primary-400">🎯 {linkedGoal.title}</p>
					{/if}
					<h2 class="text-xl font-semibold leading-snug text-text-primary">{task?.title}</h2>
					<div class="mt-3 flex flex-wrap items-center gap-3">
						{#if task}
							<span class="text-xs font-medium {priorityColor[task.priority]}">
								● {priorityLabel[task.priority]}
							</span>
							{#if task.due_at}
								<span class="text-xs text-text-tertiary">
									Fällig {new Date(task.due_at).toLocaleDateString('de-DE')}
								</span>
							{/if}
							{#if timeTrackingState.totalForTask(task.id) > 0}
								<span class="text-xs text-text-tertiary">
									⏱ {formatMinutes(timeTrackingState.totalForTask(task.id))}
								</span>
							{/if}
						{/if}
					</div>
				{:else}
					<h2 class="text-lg font-semibold text-text-primary">Freier Fokus</h2>
					<p class="mt-1 text-sm text-text-secondary">
						Keine offenen Aufgaben — die Zeit wird ohne Aufgabe gebucht.
					</p>
				{/if}
			</div>

			<!-- Steuerung -->
			<div class="mt-6 flex w-full max-w-sm flex-col gap-3">
				<button
					onclick={() => focusSession.toggle(currentTask?.id ?? null)}
					class="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary-700 text-lg font-medium text-white active:scale-95 dark:bg-primary-600"
				>
					{#if focusSession.running}
						<Pause size={20} /> Pause
					{:else if focusSession.paused}
						<Play size={20} /> Weiter
					{:else}
						<Play size={20} /> Start
					{/if}
				</button>

				<div class="flex gap-3">
					{#if focusSession.isBreak}
						<button
							onclick={() => focusSession.skipBreak()}
							class="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border-color bg-surface-1 text-sm font-medium text-text-secondary active:bg-surface-2"
						>
							<SkipForward size={16} /> Pause überspringen
						</button>
					{:else}
						<button
							onclick={() => focusSession.finishEarly()}
							disabled={!focusSession.active}
							class="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 text-sm font-medium text-primary-700 active:bg-primary-100 disabled:opacity-40 dark:border-primary-900 dark:bg-primary-950/30 dark:text-primary-300"
						>
							<Check size={16} /> Runde buchen
						</button>
					{/if}
					<button
						onclick={() => focusSession.reset()}
						disabled={!focusSession.active}
						aria-label="Session abbrechen"
						class="flex min-h-12 w-14 items-center justify-center rounded-xl border border-border-color bg-surface-1 text-text-secondary active:bg-surface-2 disabled:opacity-40"
					>
						<RotateCcw size={16} />
					</button>
				</div>

				<div class="flex gap-3">
					<button
						onclick={markDone}
						disabled={!currentTask}
						class="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border-color bg-surface-1 text-sm font-medium text-text-secondary active:bg-surface-2 disabled:opacity-40"
					>
						✓ Aufgabe erledigt
					</button>
					<button
						onclick={skipTask}
						disabled={remainingInQueue <= 1}
						class="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border-color bg-surface-1 text-sm font-medium text-text-secondary active:bg-surface-2 disabled:opacity-40"
					>
						<ChevronRight size={16} /> Nächste
					</button>
				</div>
			</div>

			<p class="mt-6 hidden text-center text-xs text-text-tertiary lg:block">
				<kbd class="rounded border border-border-color bg-surface-2 px-1.5 py-0.5 font-mono text-text-secondary">Space</kbd> Start/Pause ·
				<kbd class="rounded border border-border-color bg-surface-2 px-1.5 py-0.5 font-mono text-text-secondary">Enter</kbd> Erledigt ·
				<kbd class="rounded border border-border-color bg-surface-2 px-1.5 py-0.5 font-mono text-text-secondary">→</kbd> Nächste ·
				<kbd class="rounded border border-border-color bg-surface-2 px-1.5 py-0.5 font-mono text-text-secondary">Esc</kbd> zurück
			</p>
		</section>

		<!-- ── Queue-Spalte (Desktop nutzt die Breite, F5-Muster) ── -->
		<aside class="hidden lg:block">
			<h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-text-tertiary">
				Warteschlange ({remainingInQueue})
			</h2>
			{#if queue.length === 0}
				<p class="rounded-xl border border-border-color bg-surface-0 p-4 text-sm text-text-secondary">
					Keine offenen Aufgaben. 🎉
				</p>
			{:else}
				<ul class="flex flex-col gap-1">
					{#each queue.slice(0, 10) as task, i (task.id)}
						<li>
							<button
								onclick={() => pickTask(i)}
								class="flex min-h-12 w-full items-center gap-2 rounded-xl px-3 text-left text-sm transition-colors
									{i === currentIndex
									? 'bg-primary-50 font-medium text-primary-800 dark:bg-primary-950/30 dark:text-primary-200'
									: 'text-text-secondary hover:bg-surface-1'}"
							>
								<span class="w-4 shrink-0 text-xs tabular-nums text-text-tertiary">{i + 1}</span>
								<span class="min-w-0 flex-1 truncate">{task.title}</span>
								{#if timeTrackingState.totalForTask(task.id) > 0}
									<span class="shrink-0 text-xs text-text-tertiary">
										{formatMinutes(timeTrackingState.totalForTask(task.id))}
									</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</aside>
	</div>
</div>

<FocusSettingsSheet bind:open={settingsOpen} />

<Sheet bind:open={manualOpen} title="Zeit nachtragen">
	<div class="px-4 pb-6">
		<TimeEntryForm onsaved={() => (manualOpen = false)} />
	</div>
</Sheet>
