<script lang="ts">
	import { fitnessState } from '#lib/features/fitness/store.svelte.js';
	import { liveWorkoutState } from '#lib/features/fitness/live-workout.svelte.js';
	import { profileState } from '#lib/features/profile/store.svelte.js';
	import type { ActiveSetLog, PickedExercise } from '#lib/features/fitness/types.js';
	import RestTimerBar from './RestTimerBar.svelte';
	import PlateCalculator from './PlateCalculator.svelte';
	import ExercisePicker from './ExercisePicker.svelte';
	import StepperInput from './StepperInput.svelte';
	import SwipeToDelete from '#lib/ui/SwipeToDelete.svelte';
	import { formatPace } from '#lib/features/fitness/utils/pace.js';
	import {
		Check,
		Zap,
		Timer,
		X,
		Calculator,
		Minus,
		ListPlus,
		Save,
		Gauge,
		Plus,
		Link
	} from '@lucide/svelte';
	import Input from '#lib/ui/Input.svelte';

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
				const groupSets = liveWorkoutState.sets.filter(
					(s) => s.superset_group === set.superset_group && s.set_index === set.set_index
				);
				if (groupSets.every((s) => s.completed)) {
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
			const maxGrp = Math.max(0, ...liveWorkoutState.sets.map((s) => s.superset_group ?? 0));
			groupId = maxGrp + 1;
			liveWorkoutState.assignSupersetGroup(currentExName, groupId);
		}
		linkTargetGroup = groupId;
		showExercisePicker = true;
	}

	const isFreeStyle = $derived(liveWorkoutState.isFreestyle);
	const planName = $derived(
		isFreeStyle
			? 'Freies Workout'
			: (fitnessState.plans.find((p) => p.id === liveWorkoutState.planId)?.name ?? 'Training')
	);
	const completedSets = $derived(liveWorkoutState.sets.filter((s) => s.completed).length);

	const workoutGroups = $derived.by(() => {
		const groups = [];
		let currentGroup: { isSuperset: boolean; groupId?: number; exercises: string[] } | null = null;
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
		<h3 class="text-sm font-bold tracking-wider text-text-tertiary uppercase">
			Wähle einen Trainingsplan aus:
		</h3>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each fitnessState.plans as plan (plan.id)}
				<button
					onclick={() => liveWorkoutState.startFromPlan(plan.id)}
					class="glass-card premium-shadow flex flex-col justify-between rounded-2xl p-5 text-left transition-all hover:border-primary-400 active:scale-[0.98] dark:hover:border-primary-900"
				>
					<div>
						<h4 class="text-base font-bold text-text-primary">{plan.name}</h4>
						{#if plan.description}
							<p class="mt-1 text-xs text-text-secondary">{plan.description}</p>
						{/if}
					</div>
					<span class="mt-4 flex items-center gap-1 text-xs font-bold text-primary-active">
						<span>Workout starten</span>
						<Check size={12} />
					</span>
				</button>
			{/each}
		</div>
		<div class="pt-2">
			<button
				onclick={() => liveWorkoutState.startFreestyle()}
				class="glass-card premium-shadow flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border-color p-4 text-text-secondary transition-all hover:border-primary-400 hover:text-text-primary active:scale-[0.99] dark:hover:border-primary-700"
			>
				<Zap size={18} class="shrink-0 text-primary-active" />
				<span class="text-sm font-bold">Leeres Workout starten</span>
				<span class="ml-auto hidden text-xs text-text-tertiary sm:block"
					>Übungen spontan hinzufügen</span
				>
			</button>
		</div>
		{#if fitnessState.plans.length === 0}
			<div
				class="col-span-2 rounded-2xl border border-dashed border-border-color py-8 text-center text-sm text-text-tertiary"
			>
				Noch keine Pläne — starte ein leeres Workout oder erstelle einen Plan im Tab „Pläne".
			</div>
		{/if}
	</div>
{:else}
	<div class="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6">
		<!-- LINKS: laufendes Workout -->
		<div class="min-w-0 space-y-6">
			<div class="flex items-center justify-between">
				<h3 class="flex min-w-0 items-center gap-2 text-lg font-bold text-text-primary">
					{#if isFreeStyle}<Zap size={18} class="shrink-0 text-primary-active" />{/if}
					<span class="truncate">Logging: {planName}</span>
				</h3>
				<div class="flex shrink-0 items-center gap-3">
					{#if elapsedDisplay !== null}
						<span
							class="flex items-center gap-1 text-xs font-bold text-text-tertiary"
							title="Laufende Trainingszeit"
						>
							<Timer size={13} />
							<span>{elapsedDisplay} Min.</span>
						</span>
					{/if}
					<button
						onclick={onCancel}
						class="flex min-h-9 items-center gap-1 text-xs font-semibold text-text-tertiary transition-colors hover:text-text-primary"
					>
						<X size={13} />
						<span>Abbrechen</span>
					</button>
				</div>
			</div>

			<RestTimerBar />

			{#if liveWorkoutState.sets.length > 0}
				<div class="space-y-4">
					{#each workoutGroups as group}
						<div
							class={group.isSuperset ? 'space-y-4 border-l-4 border-l-primary-500 py-2 pl-4' : ''}
						>
							{#if group.isSuperset}
								<h4
									class="mb-2 -ml-2 text-[10px] font-bold tracking-wider text-primary-active uppercase"
								>
									Superset {String.fromCharCode(64 + group.groupId!)}
								</h4>
							{/if}
							{#each group.exercises as exName}
								{@const exSets = liveWorkoutState.setsFor(exName)}
								{@const exType = exSets[0]?.exercise_type ?? 'strength'}
								<SwipeToDelete
									onDelete={() => liveWorkoutState.removeExercise(exName)}
									label="Übung entfernen"
								>
									<div class="glass-card premium-shadow space-y-3 rounded-2xl p-4">
										<div
											class="flex items-center justify-between border-b border-border-color pb-2"
										>
											<h4 class="min-w-0 truncate text-sm font-bold text-text-primary">{exName}</h4>
											<div class="flex shrink-0 items-center">
												{#if exType === 'strength'}
													<button
														onclick={() => openPlateCalc(exName)}
														aria-label="Platten-Rechner öffnen"
														class="flex h-11 w-11 items-center justify-center rounded-lg text-text-tertiary transition-all hover:text-primary-active active:scale-90"
													>
														<Calculator size={16} />
													</button>
												{/if}
												<button
													onclick={() => promptLinkSuperset(exName)}
													aria-label="Als Superset verlinken"
													title="Superset"
													class="flex h-11 w-11 items-center justify-center rounded-lg text-text-tertiary transition-all hover:text-primary-active active:scale-90"
												>
													<Link size={16} />
												</button>
												<button
													onclick={() => liveWorkoutState.removeExercise(exName)}
													aria-label="Übung entfernen"
													class="flex h-11 w-11 items-center justify-center rounded-lg text-text-tertiary transition-all hover:text-red-500 active:scale-90"
												>
													<X size={16} />
												</button>
											</div>
										</div>

										<!--
											114px = Breite eines StepperInput (2x w-8 + w-12 + 1px Rahmen je
											Seite). Mit den bisherigen 104px sassen die Spaltentitel 10px
											neben ihren Feldern. Unterhalb von sm bricht die Satz-Zeile um und
											die Stepper stauchen sich - dort wuerden die Titel auf die falsche
											Spalte zeigen, deshalb sind sie erst ab sm sichtbar. Die Felder
											bleiben ueber Platzhalter und aria-label beschriftet.
										-->
										<div
											class="hidden items-center gap-2 pl-10 text-[10px] font-bold tracking-wider text-text-tertiary uppercase sm:flex"
										>
											{#if exType === 'strength'}
												<span class="w-28.5">Reps</span><span class="w-28.5">kg</span><span
													>RPE</span
												>
											{:else if exType === 'cardio'}
												<span class="w-28.5">Min</span><span>km</span>
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
														class="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-all hover:bg-surface-2 active:scale-90 {setTypeStyle[
															set.set_type
														]}"
													>
														{setTypeLabel(set)}
													</button>

													<div class="flex min-w-0 items-center gap-2">
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
																placeholder={last?.weight_kg != null
																	? String(last.weight_kg)
																	: 'kg'}
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
																class="h-11 w-11 shrink-0 rounded-lg border border-border-color bg-surface-0 text-center text-sm text-text-primary focus:border-primary-500 focus:outline-none"
															/>
														{:else if set.exercise_type === 'cardio'}
															<StepperInput
																bind:value={set.duration_min}
																step={1}
																placeholder={last?.duration_min != null
																	? String(last.duration_min)
																	: 'Min'}
																label="Dauer"
															/>
															<StepperInput
																bind:value={set.distance_km}
																step={0.5}
																placeholder={last?.distance_km != null
																	? String(last.distance_km)
																	: 'km'}
																label="Strecke"
															/>
															{#if formatPace(set.duration_min, set.distance_km)}
																<span
																	class="flex shrink-0 items-center gap-0.5 text-[11px] text-text-tertiary"
																>
																	<Gauge size={11} />
																	{formatPace(set.duration_min, set.distance_km)}
																</span>
															{/if}
														{:else}
															<StepperInput
																bind:value={set.duration_min}
																step={1}
																placeholder={last?.duration_min != null
																	? String(last.duration_min)
																	: 'Min'}
																label="Dauer"
															/>
														{/if}
													</div>

													<div class="ml-auto flex shrink-0 items-center gap-1.5">
														<button
															onclick={() => handleToggleSet(set)}
															class="flex h-11 w-11 items-center justify-center rounded-lg border transition-all active:scale-90
																{set.completed
																? 'border-primary-500 bg-primary-500 text-white'
																: 'border-border-color bg-surface-0 text-text-tertiary'}"
														>
															<Check size={16} strokeWidth={2.5} />
														</button>
														<button
															onclick={() => liveWorkoutState.removeSet(set.id)}
															class="flex h-11 w-11 items-center justify-center rounded-lg text-text-tertiary transition-all hover:text-red-500 active:scale-90"
														>
															<Minus size={16} />
														</button>
													</div>
												</div>
											{/each}
										</div>
										<button
											onclick={() => liveWorkoutState.addSet(exName)}
											class="flex min-h-10 items-center gap-1 text-xs font-bold text-primary-active hover:underline"
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
				<div
					class="rounded-2xl border border-dashed border-border-color py-6 text-center text-sm text-text-tertiary"
				>
					Noch keine Übungen — füge unten deine erste hinzu.
				</div>
			{/if}

			<button
				onclick={() => {
					linkTargetGroup = null;
					showExercisePicker = true;
				}}
				class="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-color text-sm font-bold text-text-secondary transition-all hover:border-primary-400 hover:text-text-primary active:scale-[0.99] dark:hover:border-primary-700"
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
		<aside class="mt-6 space-y-4 lg:sticky lg:top-6 lg:mt-0">
			<div class="glass-card premium-shadow space-y-4 rounded-2xl p-4">
				{#if liveWorkoutState.sets.length > 0}
					<p class="text-xs font-bold text-text-tertiary">
						{completedSets}/{liveWorkoutState.sets.length} Sätze erledigt
					</p>
				{/if}
				<div class="grid grid-cols-2 gap-4 lg:grid-cols-1">
					<label class="block">
						<span class="mb-1 block text-xs font-bold text-text-tertiary">Dauer (Minuten)</span>
						<Input
							type="number"
							inputmode="numeric"
							bind:value={liveWorkoutState.durationOverrideMin}
							placeholder={elapsedDisplay !== null ? `${elapsedDisplay} (auto)` : '—'}
						/>
					</label>
					<label class="block">
						<span class="mb-1 block text-xs font-bold text-text-tertiary">Notizen / Feedback</span>
						<Input bind:value={liveWorkoutState.notes} placeholder="z.B. Stark gefühlt" />
					</label>
				</div>
			</div>
			<button
				onclick={onSave}
				class="hidden min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-700 font-bold text-white transition-all hover:bg-primary-800 active:scale-[0.99] lg:flex"
			>
				<Save size={18} />
				<span>Workout speichern</span>
			</button>
		</aside>
	</div>

	<div
		class="sticky bottom-16 z-20 -mx-4 mt-4 border-t border-border-color bg-surface-0/90 px-4 pt-3 backdrop-blur md:bottom-4 md:-mx-8 md:px-8 lg:hidden"
		style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));"
	>
		<button
			onclick={onSave}
			class="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-700 font-bold text-white transition-all hover:bg-primary-800 active:scale-[0.99]"
		>
			<Save size={18} />
			<span>Workout speichern</span>
		</button>
	</div>
{/if}
