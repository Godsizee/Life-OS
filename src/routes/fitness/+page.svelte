<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { workspaceState } from '$lib/features/workspace/store.svelte';
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { liveWorkoutState } from '$lib/features/fitness/live-workout.svelte';
	import { analyticsState } from '$lib/features/analytics/store.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import { toastState } from '$lib/core/toast.svelte';
	import ExercisePicker from '$lib/features/fitness/components/ExercisePicker.svelte';
	import PlateCalculator from '$lib/features/fitness/components/PlateCalculator.svelte';
	import ExerciseLibrary from '$lib/features/fitness/components/ExerciseLibrary.svelte';
	import WorkoutFrequencyHeatmap from '$lib/features/fitness/components/WorkoutFrequencyHeatmap.svelte';
	import MuscleGroupVolumeChart from '$lib/features/fitness/components/MuscleGroupVolumeChart.svelte';
	import TrendChart from '$lib/features/fitness/components/TrendChart.svelte';
	import StepperInput from '$lib/features/fitness/components/StepperInput.svelte';
	import SwipeToDelete from '$lib/ui/SwipeToDelete.svelte';
	import { swipe } from '$lib/ui/actions/swipe';
	import { formatPace } from '$lib/features/fitness/utils/pace';
	import { currentWeekVolumeByMuscleGroup, weeklyCardioStats } from '$lib/features/fitness/utils/volume';
	import type { ActiveSetLog, PickedExercise, ExerciseType } from '$lib/features/fitness/types';
	import {
		Calculator,
		Dumbbell,
		Plus,
		Trash2,
		Calendar,
		Clock,
		Edit3,
		Save,
		Zap,
		Check,
		X,
		ListPlus,
		Minus,
		Timer,
		Gauge,
		ChevronRight
	} from 'lucide-svelte';

	$effect(() => {
		const id = workspaceState.workspace?.id;
		if (id) {
			fitnessState.load(id);
		}
		liveWorkoutState.restore();
	});

	// Welle F4 — Kalender-Planung: „Workout starten" aus einem verknüpften Termin (?startPlan=<id>).
	$effect(() => {
		const startPlanId = page.url.searchParams.get('startPlan');
		if (!startPlanId || liveWorkoutState.active) return;
		if (!fitnessState.plans.some((p) => p.id === startPlanId)) return;
		liveWorkoutState.startFromPlan(startPlanId);
		goto('/fitness', { replaceState: true });
	});

	// Persistiert jede Änderung an der laufenden Session (Sätze, Notizen, Dauer) in localStorage —
	// überlebt Reload/App-Wechsel. persist() liest alle relevanten Felder, dadurch trackt dieser
	// Effect automatisch jede Mutation (Vorbild: Svelte-5-„Deep Watch"-Muster).
	$effect(() => {
		liveWorkoutState.persist();
	});

	// Ticking Uhr für die Live-Timer-Anzeige — alle 20s, reicht für eine Minuten-Auflösung.
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

	// F6 — Pausen-Timer lebt im liveWorkoutState (Endzeitpunkt), überlebt so Navigation + Reload.
	// Hier nur die tickende Anzeige + Ende-Feedback (Vibration/Toast), solange die Seite offen ist.
	let restTick = $state(0);
	$effect(() => {
		if (liveWorkoutState.restEndsAt === null) return;
		const interval = setInterval(() => {
			restTick += 1;
			if ((liveWorkoutState.restRemainingSec() ?? 0) <= 0) {
				liveWorkoutState.stopRest();
				if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate([200, 100, 200]);
				toastState.info('⏱️ Pause vorbei — weiter geht\'s!');
			}
		}, 1000);
		return () => clearInterval(interval);
	});
	const restRemaining = $derived.by(() => {
		restTick;
		return liveWorkoutState.restEndsAt !== null ? liveWorkoutState.restRemainingSec() : null;
	});
	function handleToggleSet(set: { id: string; completed: boolean }) {
		const wasCompleted = set.completed;
		liveWorkoutState.toggleComplete(set.id);
		if (!wasCompleted) liveWorkoutState.startRest(profileState.restTimerSeconds);
	}
	function lastValueFor(set: (typeof liveWorkoutState.sets)[number]) {
		const hist = liveWorkoutState.lastValuesFor(set.exercise_id, set.exercise_name);
		return hist[set.set_index - 1] ?? null;
	}

	// F6 — Satz-Typ-Label (W/N/D/F) am Satz; Tippen wechselt den Typ.
	const setTypeStyle: Record<string, string> = {
		warmup: 'text-amber-600 dark:text-amber-400',
		dropset: 'text-purple-600 dark:text-purple-400',
		failure: 'text-red-600 dark:text-red-400',
		normal: 'text-text-tertiary'
	};
	function setTypeLabel(set: ActiveSetLog): string {
		if (set.set_type === 'warmup') return 'W';
		if (set.set_type === 'dropset') return 'D';
		if (set.set_type === 'failure') return 'F';
		return `#${set.set_index}`;
	}

	// F6 — RPE (1–10, optional) nur für Kraft-Sätze.
	function clampRpe(set: ActiveSetLog) {
		if (set.rpe === null || (set.rpe as unknown) === '') {
			set.rpe = null;
			return;
		}
		set.rpe = Math.max(1, Math.min(10, Math.round(Number(set.rpe))));
	}

	// F6 — Platten-Rechner: pro Kraft-Übung, vorbelegt mit dem nächsten offenen Satz-Gewicht.
	let showPlateCalc = $state(false);
	let plateCalcWeight = $state<number | null>(null);
	function openPlateCalc(exName: string) {
		const sets = liveWorkoutState.setsFor(exName);
		const next = sets.find((s) => !s.completed && s.weight_kg) ?? sets.find((s) => s.weight_kg);
		plateCalcWeight = next?.weight_kg ?? null;
		showPlateCalc = true;
	}

	onDestroy(() => {
		fitnessState.unload();
	});

	type FitnessTab = 'log' | 'plans' | 'library' | 'history';
	let activeTab = $state<FitnessTab>('log');
	const tabs: { id: FitnessTab; label: string }[] = [
		{ id: 'log', label: 'Workout' },
		{ id: 'plans', label: 'Pläne' },
		{ id: 'library', label: 'Bibliothek' },
		{ id: 'history', label: 'Verlauf' }
	];
	// F5 — Gesten: horizontal wischen wechselt zum Nachbar-Tab (Segmented-Control).
	function shiftTab(dir: 1 | -1) {
		const i = tabs.findIndex((t) => t.id === activeTab);
		const next = tabs[i + dir];
		if (next) activeTab = next.id;
	}

	// Welle F3 — Statistik-Daten (Sätze workspace-weit) erst laden, wenn der Verlauf-Tab
	// tatsächlich geöffnet wird (vermeidet unnötigen Vollimport bei jedem Seitenaufruf).
	$effect(() => {
		if (activeTab === 'history') void fitnessState.loadAllSetLogs();
	});
	const muscleGroupVolume = $derived(
		currentWeekVolumeByMuscleGroup(fitnessState.allSetLogs, fitnessState.catalog)
	);
	const cardioWeekly = $derived(weeklyCardioStats(fitnessState.allSetLogs));
	const cardioPacePoints = $derived(
		cardioWeekly
			.filter((w) => w.avgPaceMinPerKm !== null)
			.map((w) => ({
				label: new Date(w.weekStart).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
				value: Math.round((w.avgPaceMinPerKm as number) * 100) / 100
			}))
	);
	const cardioDistancePoints = $derived(
		cardioWeekly.map((w) => ({
			label: new Date(w.weekStart).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
			value: w.distanceKm
		}))
	);
	function formatPaceValue(v: number): string {
		const wholeMin = Math.floor(v);
		const seconds = Math.round((v - wholeMin) * 60);
		return `${wholeMin}:${String(seconds).padStart(2, '0')} /km`;
	}

	// Plan Creation
	let newPlanName = $state('');
	let newPlanDesc = $state('');
	async function handleCreatePlan() {
		if (!newPlanName.trim()) return;
		await fitnessState.addPlan({ name: newPlanName, description: newPlanDesc || null });
		newPlanName = '';
		newPlanDesc = '';
	}

	// Exercise Creation (Pläne — Vorlage, keine Session-Sätze)
	let newExName = $state('');
	let newExExerciseId = $state<string | null>(null);
	let newExType = $state<ExerciseType>('strength');
	let newExCategory = $state('Kraft');
	let newExSets = $state(3);
	let newExReps = $state(10);
	let newExWeight = $state<number | null>(null);
	let newExDuration = $state<number | null>(null);
	let newExDistance = $state<number | null>(null);
	let showPlanPicker = $state(false);

	function handlePlanExercisePicked(picked: PickedExercise) {
		newExName = picked.name;
		newExExerciseId = picked.exercise_id;
		newExType = picked.exercise_type;
		newExCategory = picked.exercise_type === 'cardio' ? 'Cardio' : picked.exercise_type === 'duration' ? 'Mobility' : 'Kraft';
	}

	async function handleAddExercise(planId: string) {
		if (!newExName.trim()) return;
		await fitnessState.addExercise(planId, {
			name: newExName,
			category: newExCategory,
			default_sets: newExSets,
			default_reps: newExReps,
			default_weight: newExType === 'strength' ? newExWeight : null,
			order_index: (fitnessState.exercises[planId]?.length ?? 0) + 1,
			exercise_id: newExExerciseId,
			exercise_type: newExType,
			default_duration_min: newExType !== 'strength' ? newExDuration : null,
			default_distance_km: newExType === 'cardio' ? newExDistance : null
		});
		newExName = '';
		newExExerciseId = null;
		newExType = 'strength';
		newExWeight = null;
		newExDuration = null;
		newExDistance = null;
	}

	// Live-Workout: Übung mitten im Training (oder beim Aufbau eines Freestyle-Workouts) hinzufügen.
	let showExercisePicker = $state(false);
	function handleWorkoutExercisePicked(picked: PickedExercise) {
		liveWorkoutState.addExercise(picked, 1);
	}

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

		// Trigger recalculation of today's life score
		await analyticsState.saveTodayScore();
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

	<!-- Navigation — Touch-taugliche Segmented-Control (F5, min. 44px Tap-Ziel) -->
	<div
		role="tablist"
		class="flex gap-1 rounded-2xl border border-border-color bg-surface-2/60 p-1"
	>
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

	<!-- Content Zones (F5 — horizontal wischen wechselt den Tab) -->
	<div use:swipe={{ onLeft: () => shiftTab(1), onRight: () => shiftTab(-1) }}>
	{#if activeTab === 'log'}
		{#if !liveWorkoutState.active}
			<!-- Plan Selection -->
			<div class="space-y-4">
				<h3 class="text-sm font-bold uppercase tracking-wider text-text-tertiary">Wähle einen Trainingsplan aus:</h3>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each fitnessState.plans as plan (plan.id)}
						<button
							onclick={() => liveWorkoutState.startFromPlan(plan.id)}
							class="glass-card text-left p-5 rounded-2xl hover:border-primary-400 dark:hover:border-primary-900 active:scale-[0.98] transition-all premium-shadow flex flex-col justify-between"
						>
							<div>
								<h4 class="font-bold text-base text-text-primary">{plan.name}</h4>
								{#if plan.description}
									<p class="text-xs text-text-secondary mt-1">{plan.description}</p>
								{/if}
							</div>
							<span class="mt-4 text-xs font-bold text-primary-active flex items-center gap-1">
								<span>Workout starten</span>
								<Check size={12} />
							</span>
						</button>
					{/each}
				</div>

				<!-- Freestyle / empty workout CTA -->
				<div class="pt-2">
					<button
						onclick={() => liveWorkoutState.startFreestyle()}
						class="w-full glass-card rounded-2xl p-4 premium-shadow border-2 border-dashed border-border-color hover:border-primary-400 dark:hover:border-primary-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3 text-text-secondary hover:text-text-primary"
					>
						<Zap size={18} class="text-primary-active shrink-0" />
						<span class="text-sm font-bold">Leeres Workout starten</span>
						<span class="text-xs text-text-tertiary ml-auto hidden sm:block">Übungen spontan hinzufügen</span>
					</button>
				</div>

				{#if fitnessState.plans.length === 0}
					<div class="col-span-2 text-center py-8 text-text-tertiary border border-dashed border-border-color rounded-2xl text-sm">
						Noch keine Pläne — starte ein leeres Workout oder erstelle einen Plan im Tab „Pläne".
					</div>
				{/if}
			</div>
		{:else}
			<!-- Interactive Log Form -->
			{@const isFreeStyle = liveWorkoutState.isFreestyle}
			{@const planName = isFreeStyle ? 'Freies Workout' : (fitnessState.plans.find((p) => p.id === liveWorkoutState.planId)?.name ?? 'Training')}
			{@const completedSets = liveWorkoutState.sets.filter((s) => s.completed).length}
			<!-- F5 — Desktop-Zwei-Spalten: Übungen links, Zusammenfassung/Speichern rechts (sticky). -->
			<div class="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:items-start">
				<!-- LINKS: laufendes Workout -->
				<div class="space-y-6 min-w-0">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-bold text-text-primary flex items-center gap-2 min-w-0">
							{#if isFreeStyle}<Zap size={18} class="text-primary-active shrink-0" />{/if}
							<span class="truncate">Logging: {planName}</span>
						</h3>
						<div class="flex items-center gap-3 shrink-0">
							{#if elapsedDisplay !== null}
								<span class="flex items-center gap-1 text-xs font-bold text-text-tertiary" title="Laufende Trainingszeit">
									<Timer size={13} />
									<span>{elapsedDisplay} Min.</span>
								</span>
							{/if}
							<button onclick={handleCancelWorkout} class="min-h-9 text-xs font-semibold text-text-tertiary hover:text-text-primary flex items-center gap-1 transition-colors">
								<X size={13} />
								<span>Abbrechen</span>
							</button>
						</div>
					</div>

					<!-- Pausen-Timer (F6 — im Store, ±15s anpassbar) -->
					{#if restRemaining !== null}
						<div class="glass-card rounded-xl p-3 premium-shadow flex items-center justify-between gap-2">
							<span class="flex items-center gap-2 text-sm font-bold text-text-primary">
								<Timer size={15} class="text-primary-active" />
								<span>Pause: {Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, '0')}</span>
							</span>
							<div class="flex items-center gap-1">
								<button
									onclick={() => liveWorkoutState.adjustRest(-15)}
									class="min-h-9 rounded-lg border border-border-color px-2 text-xs font-bold text-text-secondary active:bg-surface-2"
								>
									−15s
								</button>
								<button
									onclick={() => liveWorkoutState.adjustRest(15)}
									class="min-h-9 rounded-lg border border-border-color px-2 text-xs font-bold text-text-secondary active:bg-surface-2"
								>
									+15s
								</button>
								<button onclick={() => liveWorkoutState.stopRest()} class="min-h-9 px-2 text-xs font-semibold text-text-tertiary hover:text-text-primary">Überspringen</button>
							</div>
						</div>
					{/if}

					<!-- Set Grid (F5 — Stepper + Swipe-to-Delete) -->
					{#if liveWorkoutState.sets.length > 0}
						<div class="space-y-4">
							{#each liveWorkoutState.exerciseNames as exName}
								{@const exSets = liveWorkoutState.setsFor(exName)}
								{@const exType = exSets[0]?.exercise_type ?? 'strength'}
								<SwipeToDelete onDelete={() => liveWorkoutState.removeExercise(exName)} label="Übung entfernen">
									<div class="glass-card rounded-2xl p-4 premium-shadow space-y-3">
										<div class="flex items-center justify-between border-b border-border-color pb-2">
											<h4 class="font-bold text-sm text-text-primary min-w-0 truncate">{exName}</h4>
											<div class="flex shrink-0 items-center">
												{#if exType === 'strength'}
													<button
														onclick={() => openPlateCalc(exName)}
														aria-label="Platten-Rechner öffnen"
														title="Platten-Rechner"
														class="flex h-11 w-11 items-center justify-center rounded-lg text-text-tertiary hover:text-primary-active active:scale-90 transition-all"
													>
														<Calculator size={16} />
													</button>
												{/if}
												<button
													onclick={() => liveWorkoutState.removeExercise(exName)}
													aria-label="Übung entfernen"
													class="flex h-11 w-11 items-center justify-center rounded-lg text-text-tertiary hover:text-red-500 active:scale-90 transition-all"
												>
													<X size={16} />
												</button>
											</div>
										</div>

										<!-- Spalten-Beschriftung -->
										<div class="flex items-center gap-2 pl-10 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
											{#if exType === 'strength'}
												<span class="w-[104px]">Reps</span><span class="w-[104px]">kg</span><span>RPE</span>
											{:else if exType === 'cardio'}
												<span class="w-[104px]">Min</span><span>km</span>
											{:else}
												<span>Min</span>
											{/if}
										</div>

										<div class="space-y-2">
											{#each exSets as set (set.id)}
												{@const last = lastValueFor(set)}
												<div class="flex flex-wrap items-center gap-2">
													<!-- F6 — Satz-Typ: Tippen wechselt Normal → Warmup → Dropset → Failure -->
													<button
														onclick={() => liveWorkoutState.cycleSetType(set.id)}
														aria-label="Satz-Typ wechseln (aktuell: {set.set_type})"
														title="Satz-Typ wechseln"
														class="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold active:scale-90 transition-all hover:bg-surface-2 {setTypeStyle[set.set_type]}"
													>
														{setTypeLabel(set)}
													</button>

													<div class="flex items-center gap-2 min-w-0">
														{#if set.exercise_type === 'strength'}
															<StepperInput
																bind:value={set.reps}
																step={1}
																placeholder={last?.reps != null ? String(last.reps) : 'Reps'}
																label="Wiederholungen"
															/>
															<StepperInput
																bind:value={set.weight_kg}
																step={2.5}
																placeholder={last?.weight_kg != null ? String(last.weight_kg) : 'kg'}
																label="Gewicht"
															/>
															<!-- F6 — optionaler RPE-Input (1–10), Hevy-Muster: schlichtes Feld -->
															<input
																type="number"
																inputmode="numeric"
																min="1"
																max="10"
																bind:value={set.rpe}
																onchange={() => clampRpe(set)}
																placeholder={last?.rpe != null ? String(last.rpe) : 'RPE'}
																aria-label="RPE (gefühlte Anstrengung, 1–10)"
																class="h-11 w-11 shrink-0 rounded-lg border border-border-color bg-surface-0 text-center text-sm text-text-primary focus:outline-none focus:border-primary-500"
															/>
														{:else if set.exercise_type === 'cardio'}
															<StepperInput
																bind:value={set.duration_min}
																step={1}
																placeholder={last?.duration_min != null ? String(last.duration_min) : 'Min'}
																label="Dauer"
															/>
															<StepperInput
																bind:value={set.distance_km}
																step={0.5}
																placeholder={last?.distance_km != null ? String(last.distance_km) : 'km'}
																label="Strecke"
															/>
															{#if formatPace(set.duration_min, set.distance_km)}
																<span class="text-[11px] text-text-tertiary flex items-center gap-0.5 shrink-0">
																	<Gauge size={11} />
																	{formatPace(set.duration_min, set.distance_km)}
																</span>
															{/if}
														{:else}
															<StepperInput
																bind:value={set.duration_min}
																step={1}
																placeholder={last?.duration_min != null ? String(last.duration_min) : 'Min'}
																label="Dauer"
															/>
														{/if}
													</div>

													<div class="flex items-center gap-1.5 ml-auto shrink-0">
														<!-- Complete toggle -->
														<button
															onclick={() => handleToggleSet(set)}
															aria-label={set.completed ? 'Satz als offen markieren' : 'Satz als erledigt markieren'}
															class="flex h-11 w-11 items-center justify-center rounded-lg border active:scale-90 transition-all
																{set.completed ? 'bg-primary-500 border-primary-500 text-white' : 'border-border-color bg-surface-0 text-text-tertiary'}"
														>
															<Check size={16} strokeWidth={2.5} />
														</button>
														<!-- Remove set -->
														<button
															onclick={() => liveWorkoutState.removeSet(set.id)}
															aria-label="Satz entfernen"
															class="flex h-11 w-11 items-center justify-center rounded-lg text-text-tertiary hover:text-red-500 active:scale-90 transition-all"
														>
															<Minus size={16} />
														</button>
													</div>
												</div>
											{/each}
										</div>

										<button
											onclick={() => liveWorkoutState.addSet(exName)}
											class="min-h-10 text-xs font-bold text-primary-active flex items-center gap-1 hover:underline"
										>
											<Plus size={13} />
											<span>Satz hinzufügen</span>
										</button>
									</div>
								</SwipeToDelete>
							{/each}
						</div>
					{:else}
						<div class="text-center py-6 text-text-tertiary text-sm border border-dashed border-border-color rounded-2xl">
							Noch keine Übungen — füge unten deine erste hinzu.
						</div>
					{/if}

					<!-- Übung mitten im Workout hinzufügen -->
					<button
						onclick={() => (showExercisePicker = true)}
						class="w-full min-h-12 rounded-xl border-2 border-dashed border-border-color text-text-secondary hover:border-primary-400 hover:text-text-primary dark:hover:border-primary-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm font-bold"
					>
						<ListPlus size={16} />
						<span>Übung hinzufügen</span>
					</button>
					<ExercisePicker
						bind:open={showExercisePicker}
						filterType={null}
						onSelect={handleWorkoutExercisePicked}
					/>
					<PlateCalculator bind:open={showPlateCalc} initialWeightKg={plateCalcWeight} />
				</div>

				<!-- RECHTS (Desktop) / unten (Mobil): Zusammenfassung + Speichern -->
				<aside class="mt-6 space-y-4 lg:mt-0 lg:sticky lg:top-6">
					<div class="glass-card rounded-2xl p-4 premium-shadow space-y-4">
						{#if liveWorkoutState.sets.length > 0}
							<p class="text-xs font-bold text-text-tertiary">
								{completedSets}/{liveWorkoutState.sets.length} Sätze erledigt
							</p>
						{/if}
						<div class="grid grid-cols-2 gap-4 lg:grid-cols-1">
							<label class="block">
								<span class="text-xs font-bold text-text-tertiary block mb-1">Dauer (Minuten)</span>
								<input
									type="number"
									inputmode="numeric"
									bind:value={liveWorkoutState.durationOverrideMin}
									placeholder={elapsedDisplay !== null ? `${elapsedDisplay} (auto)` : '—'}
									class="w-full min-h-11 rounded-xl border border-border-color bg-surface-0 px-3 text-sm text-text-primary"
								/>
							</label>
							<label class="block">
								<span class="text-xs font-bold text-text-tertiary block mb-1">Notizen / Feedback</span>
								<input
									type="text"
									bind:value={liveWorkoutState.notes}
									class="w-full min-h-11 rounded-xl border border-border-color bg-surface-0 px-3 text-sm text-text-primary"
									placeholder="z.B. Stark gefühlt"
								/>
							</label>
						</div>
					</div>

					<!-- Desktop-Speichern (im sticky Sidebar) -->
					<button
						onclick={handleSaveWorkoutLog}
						class="hidden lg:flex w-full min-h-12 bg-primary-750 text-white rounded-xl font-bold items-center justify-center gap-2 hover:bg-primary-850 active:scale-[0.99] transition-all"
					>
						<Save size={18} />
						<span>Workout speichern</span>
					</button>
				</aside>
			</div>

			<!-- Sticky Primäraktion (Mobil/Tablet) — sitzt über der Bottom-Nav, respektiert Safe-Area (F5 #3/#5) -->
			<div
				class="lg:hidden sticky bottom-16 z-20 -mx-4 mt-4 border-t border-border-color bg-surface-0/90 px-4 pt-3 backdrop-blur md:bottom-4 md:-mx-8 md:px-8"
				style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));"
			>
				<button
					onclick={handleSaveWorkoutLog}
					class="w-full min-h-12 bg-primary-750 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-850 active:scale-[0.99] transition-all"
				>
					<Save size={18} />
					<span>Workout speichern</span>
				</button>
			</div>
		{/if}
	{:else if activeTab === 'plans'}
		<div class="space-y-6">
				<!-- Create Plan Form -->
				<form onsubmit={(e) => { e.preventDefault(); handleCreatePlan(); }} class="glass-card rounded-2xl p-5 premium-shadow space-y-4">
					<h3 class="text-sm font-bold uppercase tracking-wider text-text-tertiary">Neuen Plan erstellen</h3>
					<div class="grid gap-3 sm:grid-cols-2">
						<input
							bind:value={newPlanName}
							placeholder="z.B. Oberkörper / Push"
							class="min-h-10 rounded-xl border border-border-color bg-surface-0 px-3 text-sm text-text-primary"
						/>
						<input
							bind:value={newPlanDesc}
							placeholder="Beschreibung (optional)"
							class="min-h-10 rounded-xl border border-border-color bg-surface-0 px-3 text-sm text-text-primary"
						/>
					</div>
					<button
						type="submit"
						class="min-h-10 w-full rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm"
					>
						Erstellen
					</button>
				</form>

				<!-- Plans List -->
				<div class="grid gap-4 lg:grid-cols-2 lg:items-start">
					{#each fitnessState.plans as plan (plan.id)}
						<div class="glass-card rounded-2xl p-5 premium-shadow space-y-4">
							<div class="flex items-start justify-between">
								<div>
									<h4 class="font-extrabold text-base text-text-primary">{plan.name}</h4>
									{#if plan.description}
										<p class="text-xs text-text-secondary mt-1">{plan.description}</p>
									{/if}
								</div>
								<button
									onclick={() => fitnessState.removePlan(plan.id)}
									aria-label="Plan löschen"
									class="text-red-500 hover:text-red-700 transition-colors p-1"
								>
									<Trash2 size={16} />
								</button>
							</div>

							<!-- Exercises inside Plan -->
							<div class="border-t border-border-color pt-3 space-y-3">
								<h5 class="text-xs font-bold text-text-tertiary uppercase tracking-wider">Übungen:</h5>
								<ul class="space-y-2">
									{#each fitnessState.exercises[plan.id] ?? [] as ex}
										<li class="flex items-center justify-between text-xs text-text-secondary bg-surface-1/50 px-3 py-2 rounded-lg border border-border-color">
											<span>{ex.name} ({ex.category})</span>
											<span class="font-semibold">
												{#if ex.exercise_type === 'strength'}
													{ex.default_sets} Sätze x {ex.default_reps} Reps {#if ex.default_weight} @ {ex.default_weight}kg{/if}
												{:else if ex.exercise_type === 'cardio'}
													{ex.default_sets}x {#if ex.default_duration_min}{ex.default_duration_min} Min{/if} {#if ex.default_distance_km}· {ex.default_distance_km} km{/if}
												{:else}
													{ex.default_sets}x {#if ex.default_duration_min}{ex.default_duration_min} Min{/if}
												{/if}
											</span>
											<button
												onclick={() => fitnessState.removeExercise(plan.id, ex.id)}
												aria-label="Übung entfernen"
												class="ml-2 text-red-400 hover:text-red-600 transition-colors flex items-center"
											>
												<X size={13} />
											</button>
										</li>
									{/each}
								</ul>

								<!-- Add Exercise Inline Form -->
								<div class="grid grid-cols-2 gap-2 mt-2">
									<button
										onclick={() => (showPlanPicker = true)}
										class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-left col-span-2 flex items-center gap-2
											{newExName ? 'text-text-primary' : 'text-text-tertiary'}"
									>
										<ListPlus size={13} class="shrink-0 text-text-tertiary" />
										<span class="truncate">{newExName || 'Übung auswählen…'}</span>
									</button>
									{#if newExType === 'strength'}
										<input
											type="number"
											placeholder="Sätze"
											bind:value={newExSets}
											class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
										/>
										<input
											type="number"
											placeholder="Reps"
											bind:value={newExReps}
											class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
										/>
										<input
											type="number"
											step="0.5"
											placeholder="Gewicht (kg, optional)"
											bind:value={newExWeight}
											class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary col-span-2"
										/>
									{:else}
										<input
											type="number"
											placeholder="Einheiten"
											bind:value={newExSets}
											class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
										/>
										<input
											type="number"
											step="0.5"
											placeholder="Dauer (Min)"
											bind:value={newExDuration}
											class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
										/>
										{#if newExType === 'cardio'}
											<input
												type="number"
												step="0.1"
												placeholder="Strecke (km, optional)"
												bind:value={newExDistance}
												class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary col-span-2"
											/>
										{/if}
									{/if}
								</div>
								<button
									onclick={() => handleAddExercise(plan.id)}
									class="w-full min-h-9 bg-surface-2 hover:bg-surface-3 text-text-primary font-bold text-xs rounded-lg mt-2 flex items-center justify-center gap-2"
								>
									<Plus size={13} />
									<span>Übung hinzufügen</span>
								</button>
							</div>
						</div>
					{/each}
				</div>
				<ExercisePicker
					bind:open={showPlanPicker}
					filterType={null}
					onSelect={handlePlanExercisePicked}
				/>
			</div>
		{:else if activeTab === 'library'}
			<ExerciseLibrary />
		{:else}
			<!-- History View -->
			<div class="space-y-6">
				<!-- Trainingsfrequenz -->
				<div class="glass-card rounded-2xl p-4 premium-shadow">
					<h3 class="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Trainingsfrequenz</h3>
					<WorkoutFrequencyHeatmap logDates={fitnessState.logs.map((l) => l.date)} />
				</div>

				<!-- Muskelgruppen-Volumen diese Woche -->
				<div class="glass-card rounded-2xl p-4 premium-shadow">
					<h3 class="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Wochen-Volumen nach Muskelgruppe</h3>
					<MuscleGroupVolumeChart data={muscleGroupVolume} />
				</div>

				<!-- Cardio-Statistik -->
				{#if cardioWeekly.length > 0}
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="glass-card rounded-2xl p-4 premium-shadow">
							<h3 class="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Strecke pro Woche</h3>
							<TrendChart points={cardioDistancePoints} formatValue={(v) => `${v} km`} />
						</div>
						{#if cardioPacePoints.length > 0}
							<div class="glass-card rounded-2xl p-4 premium-shadow">
								<h3 class="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-3">Pace-Trend</h3>
								<TrendChart points={cardioPacePoints} formatValue={formatPaceValue} />
							</div>
						{/if}
					</div>
				{/if}

				<!-- Workout-Log -->
				<div class="grid gap-4 lg:grid-cols-2 lg:items-start">
					{#each fitnessState.logs as log (log.id)}
						{@const planName = fitnessState.plans.find((p) => p.id === log.plan_id)?.name ?? 'Freies Training'}
						<a
							href="/fitness/log/{log.id}"
							class="glass-card block rounded-2xl p-5 premium-shadow space-y-3 hover:border-primary-400 dark:hover:border-primary-900 active:scale-[0.99] transition-all"
						>
							<div class="flex items-center justify-between">
								<h4 class="font-bold text-sm text-text-primary flex items-center gap-2">
									{#if !fitnessState.plans.find((p) => p.id === log.plan_id)}
										<Zap size={13} class="text-primary-active shrink-0" />
									{/if}
									{planName}
								</h4>
								<span class="flex items-center gap-1 text-xs text-text-tertiary font-medium">
									<Calendar size={12} />
									<span>{new Date(log.date).toLocaleDateString('de-DE')}</span>
									<ChevronRight size={14} class="text-text-tertiary" />
								</span>
							</div>

							<div class="flex gap-4 text-xs font-semibold text-text-secondary border-b border-border-color pb-2">
								{#if log.duration_minutes}
									<span class="flex items-center gap-1">
										<Clock size={12} />
										<span>{log.duration_minutes} Min.</span>
									</span>
								{/if}
								{#if log.notes}
									<span class="flex items-center gap-1">
										<Edit3 size={12} />
										<span>"{log.notes}"</span>
									</span>
								{/if}
							</div>
						</a>
					{:else}
						<div class="text-center py-12 text-text-tertiary lg:col-span-2">
							Keine aufgezeichneten Workouts vorhanden.
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
