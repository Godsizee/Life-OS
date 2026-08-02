<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import * as fitnessApi from '$lib/features/fitness/api';
	import { liveWorkoutState } from '$lib/features/fitness/live-workout.svelte';
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { swipe } from '$lib/ui/actions/swipe';
	import { Dumbbell } from 'lucide-svelte';
	
	import LiveWorkoutPanel from '$lib/features/fitness/components/LiveWorkoutPanel.svelte';
	import PlansPanel from '$lib/features/fitness/components/PlansPanel.svelte';
	import HistoryPanel from '$lib/features/fitness/components/HistoryPanel.svelte';
	import StatsPanel from '$lib/features/fitness/components/StatsPanel.svelte';
	import ExerciseLibrary from '$lib/features/fitness/components/ExerciseLibrary.svelte';

	$effect(() => {
		liveWorkoutState.restore();
	});

	$effect(() => {
		const startPlanId = page.url.searchParams.get('startPlan');
		if (!startPlanId || liveWorkoutState.active) return;
		if (!fitnessState.plans.some((p) => p.id === startPlanId)) return;
		liveWorkoutState.startFromPlan(startPlanId);
		goto('/fitness', { replaceState: true });
	});

	$effect(() => {
		liveWorkoutState.persist();
	});

	let tick = $state(0);
	$effect(() => {
		if (!liveWorkoutState.active) return;
		const interval = setInterval(() => (tick += 1), 20000);
		return () => clearInterval(interval);
	});
	let elapsedDisplay = $derived.by(() => {
		tick;
		return liveWorkoutState.elapsedMinutes();
	});

	type FitnessTab = 'log' | 'plans' | 'library' | 'history';
	let activeTab = $state<FitnessTab>('log');
	const tabs: { id: FitnessTab; label: string }[] = [
		{ id: 'log', label: 'Workout' },
		{ id: 'plans', label: 'Pläne' },
		{ id: 'library', label: 'Bibliothek' },
		{ id: 'history', label: 'Verlauf' }
	];

	function shiftTab(dir: 1 | -1) {
		const i = tabs.findIndex((t) => t.id === activeTab);
		const next = tabs[i + dir];
		if (next) activeTab = next.id;
	}

	$effect(() => {
		if (activeTab === 'history') void fitnessState.loadAllSetLogs();
	});

	function handleCancelWorkout() {
		liveWorkoutState.cancel();
	}

	async function handleSaveWorkoutLog() {
		if (!liveWorkoutState.active) return;
		const duration = liveWorkoutState.durationOverrideMin ?? liveWorkoutState.elapsedMinutes();
		await fitnessState.logWorkout(
			liveWorkoutState.planId,
			duration,
			liveWorkoutState.notes || null,
			liveWorkoutState.sets,
			liveWorkoutState.announcedPRs
		);
		liveWorkoutState.finish();
		activeTab = 'history';
		await analyticsState.saveTodayScore();
	}

	async function handleRepeatWorkout(logId: string) {
		await liveWorkoutState.startFromLog(logId);
		activeTab = 'log';
	}
	async function handleSaveAsPlan(logId: string) {
		const log = fitnessState.logs.find((l) => l.id === logId);
		if (!log) return;
		const sets = await fitnessApi.listSetLogs(logId);
		if (sets.length === 0) return;

		const planName = `Plan aus ${new Date(log.date).toLocaleDateString('de-DE')}`;
		const planId = await fitnessState.addPlan({ name: planName, description: 'Aus Verlauf erstellt' });
		
		const uniqueExercises = [...new Set(sets.map(s => s.exercise_name))];
		for (let i = 0; i < uniqueExercises.length; i++) {
			const name = uniqueExercises[i];
			const exSets = sets.filter(s => s.exercise_name === name);
			const first = exSets[0];
			await fitnessState.addExercise(planId, {
				name: name,
				category: first.exercise_type === 'cardio' ? 'Cardio' : 'Kraft',
				default_sets: exSets.length,
				default_reps: Math.max(...exSets.map(s => s.reps ?? 0)),
				default_weight: Math.max(...exSets.map(s => s.weight_kg ?? 0)) || null,
				order_index: i + 1,
				exercise_id: first.exercise_id,
				exercise_type: first.exercise_type,
				default_duration_min: Math.max(...exSets.map(s => s.duration_min ?? 0)) || null,
				default_distance_km: Math.max(...exSets.map(s => s.distance_km ?? 0)) || null
			});
		}
		activeTab = 'plans';
	}
</script>

<svelte:head>
	<title>Fitness - Workouts & Trainingspläne</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
				<Dumbbell size={28} class="text-primary-600 dark:text-primary-400" />
				<span>Fitness</span>
			</h1>
			<p class="text-sm font-medium text-text-secondary">Verwalte deine Trainingspläne und logge Workouts.</p>
		</div>
	</div>

	<!-- Navigation -->
	<div role="tablist" class="flex gap-1 rounded-2xl border border-border-color bg-surface-2/60 p-1">
		{#each tabs as tab (tab.id)}
			<button
				role="tab"
				aria-selected={activeTab === tab.id}
				onclick={() => (activeTab = tab.id)}
				class="min-h-11 flex-1 rounded-xl px-2 text-center text-xs font-bold transition-all active:scale-95 xs:text-sm
					{activeTab === tab.id
						? 'bg-surface-0 text-primary-600 shadow-sm dark:text-primary-400'
						: 'text-text-secondary hover:text-text-primary'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Content Zones -->
	<div use:swipe={{ onLeft: () => shiftTab(1), onRight: () => shiftTab(-1) }}>
		{#if activeTab === 'log'}
			<LiveWorkoutPanel {elapsedDisplay} onSave={handleSaveWorkoutLog} onCancel={handleCancelWorkout} />
		{:else if activeTab === 'plans'}
			<PlansPanel />
		{:else if activeTab === 'library'}
			<ExerciseLibrary />
		{:else if activeTab === 'history'}
			<div class="space-y-6">
				<StatsPanel />
				<HistoryPanel onRepeat={handleRepeatWorkout} onSaveAsPlan={handleSaveAsPlan} />
			</div>
		{/if}
	</div>
</div>
