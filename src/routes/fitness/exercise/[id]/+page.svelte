<script lang="ts">
	// Welle F3 — Übungs-Detail: Verlauf + 1RM-/Volumen-/Pace-Progression.
	// Kein Chart-Framework im Projekt (F1-Recherche) — Muster: handgerolltes Inline-SVG (TrendChart).
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { healthState } from '$lib/features/health/store.svelte';
	import { exerciseProgression } from '$lib/features/fitness/utils/progression';
	import TrendChart from '$lib/features/fitness/components/TrendChart.svelte';
	import { ArrowLeft, Trophy, Scale } from 'lucide-svelte';

	const exerciseId = $derived(page.params.id);

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) fitnessState.load(id);
		healthState.load();
	});
	$effect(() => {
		void fitnessState.loadAllSetLogs();
	});
	onDestroy(() => {
		fitnessState.unload();
		healthState.unload();
	});

	const entry = $derived(fitnessState.catalog.find((e) => e.id === exerciseId) ?? null);
	const sets = $derived(fitnessState.allSetLogs.filter((s) => s.exercise_id === exerciseId));
	const sessions = $derived(exerciseProgression(sets));
	const pr = $derived(entry ? fitnessState.prFor(entry.name_de) : undefined);

	// Welle F4 — relative Kraft (1RM/Körpergewicht) aus dem letzten erfassten Gewicht.
	const latestBodyWeight = $derived(
		[...healthState.entries].filter((e) => e.weight_kg).sort((a, b) => b.date.localeCompare(a.date))[0]
			?.weight_kg ?? null
	);
	const relativeStrength = $derived(
		pr && latestBodyWeight ? Math.round((pr.est_1rm / latestBodyWeight) * 100) / 100 : null
	);

	function shortDate(iso: string): string {
		return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
	}

	const e1rmPoints = $derived(
		sessions.filter((s) => s.bestE1rm !== null).map((s) => ({ label: shortDate(s.date), value: s.bestE1rm as number }))
	);
	const volumePoints = $derived(
		sessions.filter((s) => s.volumeKg !== null).map((s) => ({ label: shortDate(s.date), value: s.volumeKg as number }))
	);
	const pacePoints = $derived(
		sessions
			.filter((s) => s.avgPaceMinPerKm !== null)
			.map((s) => ({ label: shortDate(s.date), value: Math.round((s.avgPaceMinPerKm as number) * 100) / 100 }))
	);
	const distancePoints = $derived(
		sessions.filter((s) => s.totalDistanceKm !== null).map((s) => ({ label: shortDate(s.date), value: s.totalDistanceKm as number }))
	);
	const durationPoints = $derived(
		sessions.filter((s) => s.totalDurationMin !== null).map((s) => ({ label: shortDate(s.date), value: s.totalDurationMin as number }))
	);

	function formatPaceValue(v: number): string {
		const wholeMin = Math.floor(v);
		const seconds = Math.round((v - wholeMin) * 60);
		return `${wholeMin}:${String(seconds).padStart(2, '0')} /km`;
	}
</script>

<svelte:head>
	<title>{entry ? entry.name_de : 'Übung'} - Fitness</title>
</svelte:head>

<a href="/fitness" class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary">
	<ArrowLeft size={16} /> Fitness
</a>

{#if !entry}
	<div class="rounded-2xl border border-border-color bg-surface-0 p-8 text-center text-text-secondary">
		{#if fitnessState.loading}
			Lade Übung…
		{:else}
			Übung nicht gefunden.
		{/if}
	</div>
{:else}
	<div class="space-y-6">
		<!-- Kopf -->
		<header class="space-y-2">
			<h1 class="text-2xl font-bold tracking-tight text-text-primary">{entry.name_de}</h1>
			<div class="flex flex-wrap gap-1.5">
				{#if entry.muscle_group}
					<span class="rounded-full border border-border-color bg-surface-2 px-2 py-0.5 text-[11px] text-text-tertiary">{entry.muscle_group}</span>
				{/if}
				{#if entry.equipment}
					<span class="rounded-full border border-border-color bg-surface-2 px-2 py-0.5 text-[11px] text-text-tertiary">{entry.equipment}</span>
				{/if}
				<span class="rounded-full border border-border-color bg-surface-2 px-2 py-0.5 text-[11px] text-text-tertiary">
					{entry.exercise_type === 'strength' ? 'Kraft' : entry.exercise_type === 'cardio' ? 'Cardio' : 'Zeitbasiert'}
				</span>
			</div>
		</header>

		{#if sessions.length === 0}
			<div class="text-center py-8 text-text-tertiary border border-dashed border-border-color rounded-2xl text-sm">
				Noch kein Workout mit dieser Übung geloggt.
			</div>
		{:else}
			{#if entry.exercise_type === 'strength'}
				{#if pr}
					<div class="glass-card rounded-2xl p-4 premium-shadow flex items-center justify-between">
						<span class="flex items-center gap-2 text-sm font-bold text-text-primary">
							<Trophy size={16} class="text-amber-500" />
							<span>Aktuelles PR (geschätztes 1RM)</span>
						</span>
						<span class="font-mono text-sm text-text-primary">{pr.est_1rm} kg</span>
					</div>
				{/if}
				{#if relativeStrength !== null}
					<div class="glass-card rounded-2xl p-4 premium-shadow flex items-center justify-between">
						<span class="flex items-center gap-2 text-sm font-bold text-text-primary">
							<Scale size={16} class="text-blue-500" />
							<span>Relative Kraft (1RM/Körpergewicht)</span>
						</span>
						<span class="font-mono text-sm text-text-primary">{relativeStrength}×</span>
					</div>
				{/if}
				<div class="glass-card rounded-2xl p-4 premium-shadow">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">1RM-Progression</h2>
					<TrendChart points={e1rmPoints} formatValue={(v) => `${v} kg`} />
				</div>
				<div class="glass-card rounded-2xl p-4 premium-shadow">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Volumen je Session</h2>
					<TrendChart points={volumePoints} formatValue={(v) => `${v.toLocaleString('de-DE')} kg`} />
				</div>
			{:else if entry.exercise_type === 'cardio'}
				<div class="glass-card rounded-2xl p-4 premium-shadow">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Pace-Trend</h2>
					<TrendChart points={pacePoints} formatValue={formatPaceValue} />
				</div>
				<div class="glass-card rounded-2xl p-4 premium-shadow">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Strecke je Session</h2>
					<TrendChart points={distancePoints} formatValue={(v) => `${v} km`} />
				</div>
			{:else}
				<div class="glass-card rounded-2xl p-4 premium-shadow">
					<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Dauer je Session</h2>
					<TrendChart points={durationPoints} formatValue={(v) => `${v} Min.`} />
				</div>
			{/if}

			<!-- Session-Verlauf -->
			<div class="space-y-2">
				<h2 class="text-xs font-bold uppercase tracking-wider text-text-tertiary">Verlauf</h2>
				{#each [...sessions].reverse() as s (s.date)}
					<div class="glass-card rounded-xl p-3 premium-shadow flex items-center justify-between text-xs">
						<span class="font-semibold text-text-primary">{new Date(s.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
						<span class="text-text-secondary">
							{#if s.bestE1rm !== null}
								{s.bestE1rm} kg (1RM) · {s.volumeKg} kg Volumen
							{:else if s.totalDistanceKm !== null}
								{s.totalDistanceKm} km · {s.totalDurationMin} Min.
								{#if s.avgPaceMinPerKm}· {formatPaceValue(s.avgPaceMinPerKm)}{/if}
							{:else}
								{s.totalDurationMin} Min.
							{/if}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
