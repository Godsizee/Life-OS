<script lang="ts">
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import { liveWorkoutState } from '$lib/features/fitness/live-workout.svelte';
	import { profileState } from '$lib/features/profile/store.svelte';
	import type { ActiveSetLog, PickedExercise } from '$lib/features/fitness/types';
	import RestTimerBar from './RestTimerBar.svelte';
	import PlateCalculator from './PlateCalculator.svelte';
	import ExercisePicker from './ExercisePicker.svelte';
	import StepperInput from './StepperInput.svelte';
	import SwipeToDelete from '$lib/ui/SwipeToDelete.svelte';
	import { formatPace } from '$lib/features/fitness/utils/pace';
	import { Check, Zap, Timer, X, Calculator, Minus, ListPlus, Save, Gauge, Plus, Link } from 'lucide-svelte';
	import Input from '$lib/ui/Input.svelte';

	interface Props {
		elapsedDisplay: number | null;
		onSave: () => void;
		onCancel: () => void;
	}
	let { elapsedDisplay, onSave, onCancel }: Props = $props();

	function handleToggleSet(set: ActiveSetLog) {
		const wasCompleted = set.completed;
		liveWorkoutState.toggleComplete(set.id);
		if (!wasCompleted) {
			if (set.superset_group != null) {
				const groupSets = liveWorkoutState.sets.filter(s => s.superset_group === set.superset_group && s.set_index === set.set_index);
				if (groupSets.every(s => s.completed)) {
					liveWorkoutState.startRest(profileState.restTimerSeconds);
				}
			} else {
				liveWorkoutState.startRest(profileState.restTimerSeconds);
			}
		}
	}

	function lastValueFor(set: (typeof liveWorkoutState.sets)[number]) {
		const hist = liveWorkoutState.lastValuesFor(set.exercise_id, set.exercise_name);
		return hist[set.set_index - 1] ?? null;
	}

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

	function clampRpe(set: ActiveSetLog) {
		if (set.rpe === null || (set.rpe as unknown) === '') {
			set.rpe = null;
			return;
		}
		set.rpe = Math.max(1, Math.min(10, Math.round(Number(set.rpe))));
	}

	let showPlateCalc = $state(false);
	let plateCalcWeight = $state<number | null>(null);
	function openPlateCalc(exName: string) {
		const sets = liveWorkoutState.setsFor(exName);
		const next = sets.find((s) => !s.completed && s.weight_kg) ?? sets.find((s) => s.weight_kg);
		plateCalcWeight = next?.weight_kg ?? null;
		showPlateCalc = true;
	}

	let showExercisePicker = $state(false);
	let linkTargetGroup = $state<number | null>(null);

	function handleWorkoutExercisePicked(picked: PickedExercise) {
		liveWorkoutState.addExercise(picked, 1, linkTargetGroup);
		linkTargetGroup = null;
	}

	function promptLinkSuperset(currentExName: string) {
		const existingSets = liveWorkoutState.setsFor(currentExName);
		let groupId = existingSets[0]?.superset_group;
		if (groupId == null) {
			const maxGrp = Math.max(0, ...liveWorkoutState.sets.map(s => s.superset_group ?? 0));
			groupId = maxGrp + 1;
			liveWorkoutState.assignSupersetGroup(currentExName, groupId);
		}
		linkTargetGroup = groupId;
		showExercisePicker = true;
	}

	const isFreeStyle = $derived(liveWorkoutState.isFreestyle);
	const planName = $derived(isFreeStyle ? 'Freies Workout' : (fitnessState.plans.find((p) => p.id === liveWorkoutState.planId)?.name ?? 'Training'));
	const completedSets = $derived(liveWorkoutState.sets.filter((s) => s.completed).length);

	const workoutGroups = $derived.by(() => {
		const groups = [];
		let currentGroup: { isSuperset: boolean, groupId?: number, exercises: string[] } | null = null;
		for (const exName of liveWorkoutState.exerciseNames) {
			const sets = liveWorkoutState.setsFor(exName);
			const sg = sets[0]?.superset_group;
			if (sg != null) {
				if (currentGroup && currentGroup.isSuperset && currentGroup.groupId === sg) {
					currentGroup.exercises.push(exName);
				} else {
					currentGroup = { isSuperset: true, groupId: sg, exercises: [exName] };
					groups.push(currentGroup);
				}
			} else {
				currentGroup = { isSuperset: false, exercises: [exName] };
				groups.push(currentGroup);
			}
		}
		return groups;
	});
</script>

{#if !liveWorkoutState.active}
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
					<button onclick={onCancel} class="min-h-9 text-xs font-semibold text-text-tertiary hover:text-text-primary flex items-center gap-1 transition-colors">
						<X size={13} />
						<span>Abbrechen</span>
					</button>
				</div>
			</div>

			<RestTimerBar />

			{#if liveWorkoutState.sets.length > 0}
				<div class="space-y-4">
					{#each workoutGroups as group}
						<div class="{group.isSuperset ? 'border-l-4 border-l-primary-500 pl-4 py-2 space-y-4' : ''}">
							{#if group.isSuperset}
								<h4 class="text-[10px] font-bold text-primary-active uppercase tracking-wider mb-2 -ml-2">Superset {String.fromCharCode(64 + group.groupId!)}</h4>
							{/if}
							{#each group.exercises as exName}
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
														class="flex h-11 w-11 items-center justify-center rounded-lg text-text-tertiary hover:text-primary-active active:scale-90 transition-all"
													>
														<Calculator size={16} />
													</button>
												{/if}
												<button
													onclick={() => promptLinkSuperset(exName)}
													aria-label="Als Superset verlinken"
													title="Superset"
													class="flex h-11 w-11 items-center justify-center rounded-lg text-text-tertiary hover:text-primary-active active:scale-90 transition-all"
												>
													<Link size={16} />
												</button>
												<button
													onclick={() => liveWorkoutState.removeExercise(exName)}
													aria-label="Übung entfernen"
													class="flex h-11 w-11 items-center justify-center rounded-lg text-text-tertiary hover:text-red-500 active:scale-90 transition-all"
												>
													<X size={16} />
												</button>
											</div>
										</div>

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
													<button
														onclick={() => liveWorkoutState.cycleSetType(set.id)}
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
															<input
																type="number"
																inputmode="numeric"
																min="1"
																max="10"
																bind:value={set.rpe}
																onchange={() => clampRpe(set)}
																placeholder={last?.rpe != null ? String(last.rpe) : 'RPE'}
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
														<button
															onclick={() => handleToggleSet(set)}
															class="flex h-11 w-11 items-center justify-center rounded-lg border active:scale-90 transition-all
																{set.completed ? 'bg-primary-500 border-primary-500 text-white' : 'border-border-color bg-surface-0 text-text-tertiary'}"
														>
															<Check size={16} strokeWidth={2.5} />
														</button>
														<button
															onclick={() => liveWorkoutState.removeSet(set.id)}
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
					{/each}
				</div>
			{:else}
				<div class="text-center py-6 text-text-tertiary text-sm border border-dashed border-border-color rounded-2xl">
					Noch keine Übungen — füge unten deine erste hinzu.
				</div>
			{/if}

			<button
				onclick={() => { linkTargetGroup = null; showExercisePicker = true; }}
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

		<!-- RECHTS / unten -->
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
						<Input
							type="number"
							inputmode="numeric"
							bind:value={liveWorkoutState.durationOverrideMin}
							placeholder={elapsedDisplay !== null ? `${elapsedDisplay} (auto)` : '—'}
						/>
					</label>
					<label class="block">
						<span class="text-xs font-bold text-text-tertiary block mb-1">Notizen / Feedback</span>
						<Input
							bind:value={liveWorkoutState.notes}
							placeholder="z.B. Stark gefühlt"
						/>
					</label>
				</div>
			</div>
			<button
				onclick={onSave}
				class="hidden lg:flex w-full min-h-12 bg-primary-700 text-white rounded-xl font-bold items-center justify-center gap-2 hover:bg-primary-800 active:scale-[0.99] transition-all"
			>
				<Save size={18} />
				<span>Workout speichern</span>
			</button>
		</aside>
	</div>

	<div
		class="lg:hidden sticky bottom-16 z-20 -mx-4 mt-4 border-t border-border-color bg-surface-0/90 px-4 pt-3 backdrop-blur md:bottom-4 md:-mx-8 md:px-8"
		style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));"
	>
		<button
			onclick={onSave}
			class="w-full min-h-12 bg-primary-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-800 active:scale-[0.99] transition-all"
		>
			<Save size={18} />
			<span>Workout speichern</span>
		</button>
	</div>
{/if}
