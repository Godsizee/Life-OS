<script lang="ts">
	import { fitnessState } from '$lib/features/fitness/store.svelte';
	import ExercisePicker from '$lib/features/fitness/components/ExercisePicker.svelte';
	import type { PickedExercise, ExerciseType } from '$lib/features/fitness/types';
	import { Trash2, Plus, X, ListPlus } from 'lucide-svelte';
	import Input from '$lib/ui/Input.svelte';
	import StepperInput from '$lib/features/fitness/components/StepperInput.svelte';

	let newPlanName = $state('');
	let newPlanDesc = $state('');
	
	async function handleCreatePlan() {
		if (!newPlanName.trim()) return;
		await fitnessState.addPlan({ name: newPlanName, description: newPlanDesc || null });
		newPlanName = '';
		newPlanDesc = '';
	}

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
</script>

<div class="space-y-6">
	<!-- Create Plan Form -->
	<form onsubmit={(e) => { e.preventDefault(); handleCreatePlan(); }} class="glass-card rounded-2xl p-5 premium-shadow space-y-4">
		<h3 class="text-sm font-bold uppercase tracking-wider text-text-tertiary">Neuen Plan erstellen</h3>
		<div class="grid gap-3 sm:grid-cols-2">
			<Input
				bind:value={newPlanName}
				placeholder="z.B. Oberkörper / Push"
			/>
			<Input
				bind:value={newPlanDesc}
				placeholder="Beschreibung (optional)"
			/>
		</div>
		<button
			type="submit"
			class="min-h-10 w-full rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm transition-all active:scale-[0.99]"
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
								<span class="font-semibold text-right">
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
									class="ml-2 text-red-400 hover:text-red-600 transition-colors flex items-center shrink-0"
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
							class="min-h-10 rounded-xl border border-border-color bg-surface-0 px-3 text-xs text-left col-span-2 flex items-center gap-2
								{newExName ? 'text-text-primary' : 'text-text-tertiary'}"
						>
							<ListPlus size={14} class="shrink-0 text-text-tertiary" />
							<span class="truncate">{newExName || 'Übung auswählen…'}</span>
						</button>
						{#if newExType === 'strength'}
							<StepperInput label="Sätze" bind:value={newExSets} step={1} />
							<StepperInput label="Reps" bind:value={newExReps} step={1} />
							<div class="col-span-2">
								<StepperInput label="Gewicht (kg, opt)" step={2.5} bind:value={newExWeight} />
							</div>
						{:else}
							<StepperInput label="Einheiten" bind:value={newExSets} step={1} />
							<StepperInput label="Dauer (Min)" step={1} bind:value={newExDuration} />
							{#if newExType === 'cardio'}
								<div class="col-span-2">
									<StepperInput label="Strecke (km, opt)" step={0.5} bind:value={newExDistance} />
								</div>
							{/if}
						{/if}
					</div>
					<button
						onclick={() => handleAddExercise(plan.id)}
						class="w-full min-h-10 bg-surface-2 hover:bg-surface-3 text-text-primary font-bold text-xs rounded-xl mt-2 flex items-center justify-center gap-2"
					>
						<Plus size={14} />
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
