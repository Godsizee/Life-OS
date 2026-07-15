<script lang="ts">
	// Welle F3 — Log-Detail: alle Sätze, Gesamtvolumen, PRs des Workouts.
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import * as fitnessApi from '$lib/features/fitness/api';
	import { bestPerExercise } from '$lib/features/fitness/utils/1rm';
	import { formatPace } from '$lib/features/fitness/utils/pace';
	import type { WorkoutSetLog } from '$lib/features/fitness/types';
	import { ArrowLeft, Calendar, Clock, Edit3, Zap, Trophy, Gauge } from 'lucide-svelte';

	const logId = $derived(page.params.id);

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) fitnessState.load(id);
	});
	onDestroy(() => fitnessState.unload());

	const log = $derived(fitnessState.logs.find((l) => l.id === logId) ?? null);
	const planName = $derived(
		log ? (fitnessState.plans.find((p) => p.id === log.plan_id)?.name ?? 'Freies Training') : ''
	);
	const isFreestyle = $derived(!!log && !fitnessState.plans.find((p) => p.id === log.plan_id));

	let sets = $state<WorkoutSetLog[]>([]);
	let loadingSets = $state(true);
	$effect(() => {
		const id = logId;
		if (!id) return;
		loadingSets = true;
		fitnessApi.listSetLogs(id).then((s) => {
			sets = s;
			loadingSets = false;
		});
	});

	const exerciseNames = $derived([...new Set(sets.map((s) => s.exercise_name))]);
	function setsFor(name: string): WorkoutSetLog[] {
		return sets.filter((s) => s.exercise_name === name).sort((a, b) => a.set_index - b.set_index);
	}
	function exerciseIdFor(name: string): string | null {
		return sets.find((s) => s.exercise_name === name)?.exercise_id ?? null;
	}

	// F6 — Warmup-Sätze zählen nicht ins Arbeitsvolumen.
	const totalVolumeKg = $derived(
		Math.round(
			sets.reduce(
				(sum, s) =>
					sum + (s.completed && s.set_type !== 'warmup' && s.weight_kg && s.reps ? s.weight_kg * s.reps : 0),
				0
			)
		)
	);

	// F6 — Satz-Typ-Kennzeichnung (W/D/F) in der Satzliste.
	const setTypeBadge: Record<string, { label: string; cls: string }> = {
		warmup: { label: 'W', cls: 'text-amber-600 dark:text-amber-400' },
		dropset: { label: 'D', cls: 'text-purple-600 dark:text-purple-400' },
		failure: { label: 'F', cls: 'text-red-600 dark:text-red-400' }
	};
	const totalDistanceKm = $derived(
		Math.round(sets.reduce((sum, s) => sum + (s.completed && s.distance_km ? s.distance_km : 0), 0) * 10) / 10
	);

	const bestsToday = $derived(bestPerExercise(sets));
	function prForExercise(exerciseName: string) {
		return bestsToday.find((b) => b.exercise_name === exerciseName);
	}
	function isPR(exerciseName: string, est1rm: number): boolean {
		if (!log) return false;
		const pr = fitnessState.prFor(exerciseName);
		return !!pr && pr.est_1rm === est1rm && pr.achieved_at?.slice(0, 10) === log.date;
	}
</script>

<svelte:head>
	<title>Workout-Log - Fitness</title>
</svelte:head>

<a href="/fitness" class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary">
	<ArrowLeft size={16} /> Fitness
</a>

{#if !log}
	<div class="rounded-2xl border border-border-color bg-surface-0 p-8 text-center text-text-secondary">
		{#if fitnessState.loading}
			Lade Workout…
		{:else}
			Workout nicht gefunden.
		{/if}
	</div>
{:else}
	<div class="space-y-6">
		<!-- Kopf -->
		<header class="space-y-2">
			<h1 class="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
				{#if isFreestyle}<Zap size={18} class="text-primary-active shrink-0" />{/if}
				<span>{planName}</span>
			</h1>
			<div class="flex flex-wrap gap-4 text-xs font-semibold text-text-secondary">
				<span class="flex items-center gap-1">
					<Calendar size={12} />
					<span>{new Date(log.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
				</span>
				{#if log.duration_minutes}
					<span class="flex items-center gap-1">
						<Clock size={12} />
						<span>{log.duration_minutes} Min.</span>
					</span>
				{/if}
			</div>
			{#if log.notes}
				<p class="flex items-start gap-1.5 text-sm text-text-secondary">
					<Edit3 size={13} class="mt-0.5 shrink-0" />
					<span>"{log.notes}"</span>
				</p>
			{/if}
		</header>

		<!-- Stats -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			<div class="glass-card rounded-2xl p-4 premium-shadow">
				<p class="text-[11px] uppercase tracking-wider text-text-tertiary font-bold">Gesamtvolumen</p>
				<p class="text-lg font-extrabold text-text-primary">{totalVolumeKg.toLocaleString('de-DE')} kg</p>
			</div>
			{#if totalDistanceKm > 0}
				<div class="glass-card rounded-2xl p-4 premium-shadow">
					<p class="text-[11px] uppercase tracking-wider text-text-tertiary font-bold">Strecke</p>
					<p class="text-lg font-extrabold text-text-primary">{totalDistanceKm} km</p>
				</div>
			{/if}
			<div class="glass-card rounded-2xl p-4 premium-shadow">
				<p class="text-[11px] uppercase tracking-wider text-text-tertiary font-bold">Übungen</p>
				<p class="text-lg font-extrabold text-text-primary">{exerciseNames.length}</p>
			</div>
		</div>

		<!-- Sätze je Übung -->
		{#if loadingSets}
			<p class="text-sm text-text-tertiary">Lade Sätze…</p>
		{:else if exerciseNames.length === 0}
			<div class="text-center py-8 text-text-tertiary border border-dashed border-border-color rounded-2xl text-sm">
				Keine Sätze für dieses Workout aufgezeichnet.
			</div>
		{:else}
			<div class="space-y-4">
				{#each exerciseNames as exName}
					{@const exId = exerciseIdFor(exName)}
					{@const best = prForExercise(exName)}
					<div class="glass-card rounded-2xl p-4 premium-shadow space-y-3">
						<div class="flex items-center justify-between border-b border-border-color pb-2">
							{#if exId}
								<a href="/fitness/exercise/{exId}" class="font-bold text-sm text-text-primary hover:text-primary-active hover:underline">
									{exName}
								</a>
							{:else}
								<h4 class="font-bold text-sm text-text-primary">{exName}</h4>
							{/if}
							{#if best && isPR(exName, best.est_1rm)}
								<span class="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
									<Trophy size={12} />
									<span>Neuer PR</span>
								</span>
							{/if}
						</div>

						<div class="space-y-1.5">
							{#each setsFor(exName) as set (set.id)}
								{@const badge = setTypeBadge[set.set_type]}
								<div class="flex items-center justify-between text-xs">
									<span class="font-bold w-6 shrink-0 {badge ? badge.cls : 'text-text-tertiary'}">
										{badge ? badge.label : `#${set.set_index}`}
									</span>
									<span class="flex-1 text-text-secondary">
										{#if set.exercise_type === 'strength'}
											{set.reps ?? '–'} Reps {#if set.weight_kg}× {set.weight_kg} kg{/if}
										{:else if set.exercise_type === 'cardio'}
											{set.duration_min ?? '–'} Min · {set.distance_km ?? '–'} km
											{#if formatPace(set.duration_min, set.distance_km)}
												<span class="inline-flex items-center gap-0.5 ml-1 text-text-tertiary">
													<Gauge size={10} />{formatPace(set.duration_min, set.distance_km)}
												</span>
											{/if}
										{:else}
											{set.duration_min ?? '–'} Min
										{/if}
										{#if set.rpe}
											<span class="text-text-tertiary">· RPE {set.rpe}</span>
										{/if}
									</span>
									<span class={set.completed ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-text-tertiary'}>
										{set.completed ? '✓' : '–'}
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
