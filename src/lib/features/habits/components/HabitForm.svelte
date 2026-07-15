<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Select from '$lib/ui/Select.svelte';
	import { habitsState } from '../store.svelte';
	import { goalsState } from '$lib/features/goals/store.svelte';

	const weekdayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

	let name = $state('');
	let frequency = $state<'daily' | 'weekly'>('daily');
	let days = $state<number[]>([1, 2, 3, 4, 5]);
	let goalId = $state<string>('');

	// Nur offene Ziele zur Auswahl anbieten
	const openGoals = $derived(goalsState.goals.filter((g) => g.status === 'open'));

	function toggleDay(day: number) {
		days = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort();
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim()) return;
		await habitsState.addHabit({
			name,
			schedule: frequency === 'daily' ? { type: 'daily' } : { type: 'weekly', days },
			goal_id: goalId || null
		});
		name = '';
		goalId = '';
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-2">
	<Input placeholder="Neue Gewohnheit…" bind:value={name} required />

	<!-- Frequenz-Toggle -->
	<div class="flex gap-2">
		<button
			type="button"
			onclick={() => (frequency = 'daily')}
			class="rounded-full px-3 py-1 text-xs font-medium {frequency === 'daily'
				? 'bg-primary-600 text-white'
				: 'bg-surface-2 text-text-secondary border border-border-color/30'}"
		>
			Täglich
		</button>
		<button
			type="button"
			onclick={() => (frequency = 'weekly')}
			class="rounded-full px-3 py-1 text-xs font-medium {frequency === 'weekly'
				? 'bg-primary-600 text-white'
				: 'bg-surface-2 text-text-secondary border border-border-color/30'}"
		>
			Wochentage
		</button>
	</div>

	{#if frequency === 'weekly'}
		<div class="flex flex-wrap gap-2">
			{#each weekdayLabels as label, day (day)}
				<button
					type="button"
					onclick={() => toggleDay(day)}
					class="min-h-12 min-w-12 rounded-xl text-sm font-medium {days.includes(day)
						? 'bg-primary-600 text-white'
						: 'bg-surface-2 text-text-secondary border border-border-color/30'}"
				>
					{label}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Ziel-Verknüpfung (#10) -->
	{#if openGoals.length > 0}
		<Select bind:value={goalId}>
			<option value="">🎯 Kein Ziel verknüpft</option>
			{#each openGoals as goal (goal.id)}
				<option value={goal.id}>{goal.title}</option>
			{/each}
		</Select>
	{/if}

	<Button type="submit">
		{#snippet children()}
			Hinzufügen
		{/snippet}
	</Button>
</form>
