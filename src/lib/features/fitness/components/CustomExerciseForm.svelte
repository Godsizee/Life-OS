<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import Button from '$lib/ui/Button.svelte';
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
	<Input bind:value={nameDe} placeholder="Übungsname..." />
	<div class="grid grid-cols-2 gap-2">
		<Input bind:value={muscleGroup} list="fitness-muscle-groups" placeholder="Muskelgruppe (optional)" />
		<datalist id="fitness-muscle-groups">
			{#each fitnessState.availableMuscleGroups as group}
				<option value={group}></option>
			{/each}
		</datalist>
		<Input bind:value={equipment} placeholder="Equipment (optional)" />
	</div>
	<Select bind:value={exerciseType}>
		<option value="strength">Kraft (Sätze × Reps × Gewicht)</option>
		<option value="cardio">Cardio (Zeit + Strecke)</option>
		<option value="duration">Zeitbasiert (nur Dauer)</option>
	</Select>
	<Button type="submit" variant="secondary" disabled={!nameDe.trim() || submitting}>
		{#snippet children()}
			<span class="flex items-center justify-center gap-2">
				<Plus size={13} />
				<span>Eigene Übung anlegen</span>
			</span>
		{/snippet}
	</Button>
</form>
