<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { goalsState } from '../store.svelte';

	let title = $state('');
	let targetDate = $state('');
	let goalType = $state<'standard' | 'pr' | 'fitness_frequency'>('standard');
	let targetExercise = $state('');
	let targetValue = $state<number | null>(null);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim()) return;
		await goalsState.addGoal({
			title,
			target_date: targetDate || null,
			goal_type: goalType,
			target_exercise: goalType === 'pr' ? targetExercise.trim() || null : null,
			target_value: goalType === 'pr' || goalType === 'fitness_frequency' ? targetValue : null
		});
		title = '';
		targetDate = '';
		targetExercise = '';
		targetValue = null;
		goalType = 'standard';
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
	<Input placeholder="Neues Ziel…" bind:value={title} required />

	<div class="flex gap-2">
		<button
			type="button"
			onclick={() => (goalType = 'standard')}
			class="flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors {goalType ===
			'standard'
				? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400'
				: 'border-border-color bg-surface-1 text-text-secondary'}"
		>
			Standard
		</button>
		<button
			type="button"
			onclick={() => (goalType = 'pr')}
			class="flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors {goalType ===
			'pr'
				? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400'
				: 'border-border-color bg-surface-1 text-text-secondary'}"
		>
			🏋️ Kraft-Ziel (PR)
		</button>
		<button
			type="button"
			onclick={() => (goalType = 'fitness_frequency')}
			class="flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors {goalType ===
			'fitness_frequency'
				? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400'
				: 'border-border-color bg-surface-1 text-text-secondary'}"
		>
			📅 Trainings-Frequenz
		</button>
	</div>

	{#if goalType === 'pr'}
		<div class="flex gap-2">
			<Input placeholder="Übung (z. B. Kreuzheben)" bind:value={targetExercise} />
			<div class="w-32">
				<Input type="number" min="1" step="0.5" placeholder="Ziel-1RM kg" bind:value={targetValue} />
			</div>
		</div>
	{:else if goalType === 'fitness_frequency'}
		<Input type="number" min="1" max="14" placeholder="Trainings/Woche" bind:value={targetValue} />
	{/if}

	<Input type="date" bind:value={targetDate} />
	<Button type="submit">
		{#snippet children()}
			Hinzufügen
		{/snippet}
	</Button>
</form>
