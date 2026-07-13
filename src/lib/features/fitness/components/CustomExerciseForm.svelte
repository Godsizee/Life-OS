<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import { fitnessState } from '../store.svelte';
	import type { ExerciseType, PickedExercise } from '../types';

	let { onCreated }: { onCreated: (picked: PickedExercise) => void } = $props();

	let nameDe = $state('');
	let nameEn = $state('');
	let exerciseType = $state<ExerciseType>('strength');
	let muscleGroup = $state('');
	let equipment = $state('');
	let submitting = $state(false);

	async function handleSubmit() {
		if (!nameDe.trim() || submitting) return;
		submitting = true;
		try {
			const picked = await fitnessState.addCustomExercise({
				name_de: nameDe.trim(),
				name_en: nameEn.trim() || null,
				exercise_type: exerciseType,
				muscle_group: muscleGroup.trim() || null,
				equipment: equipment.trim() || null
			});
			nameDe = '';
			nameEn = '';
			exerciseType = 'strength';
			muscleGroup = '';
			equipment = '';
			onCreated(picked);
		} finally {
			submitting = false;
		}
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	class="space-y-2"
>
	<input
		bind:value={nameDe}
		placeholder="Übungsname..."
		class="min-h-9 w-full rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
	/>
	<div class="grid grid-cols-2 gap-2">
		<input
			bind:value={muscleGroup}
			list="fitness-muscle-groups"
			placeholder="Muskelgruppe (optional)"
			class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
		/>
		<datalist id="fitness-muscle-groups">
			{#each fitnessState.availableMuscleGroups as group}
				<option value={group}></option>
			{/each}
		</datalist>
		<input
			bind:value={equipment}
			placeholder="Equipment (optional)"
			class="min-h-9 rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
		/>
	</div>
	<select
		bind:value={exerciseType}
		class="min-h-9 w-full rounded-lg border border-border-color bg-surface-0 px-2 text-xs text-text-primary"
	>
		<option value="strength">Kraft (Sätze × Reps × Gewicht)</option>
		<option value="cardio">Cardio (Zeit + Strecke)</option>
		<option value="duration">Zeitbasiert (nur Dauer)</option>
	</select>
	<button
		type="submit"
		disabled={!nameDe.trim() || submitting}
		class="w-full min-h-9 bg-surface-2 hover:bg-surface-3 text-text-primary font-bold text-xs rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
	>
		<Plus size={13} />
		<span>Eigene Übung anlegen</span>
	</button>
</form>
