<script lang="ts">
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Field from '$lib/ui/Field.svelte';
	import Select from '$lib/ui/Select.svelte';
	import { goalsState } from '../store.svelte';
	import type { GoalType } from '../types';

	let { onsubmitted, parentId = null }: { onsubmitted?: () => void; parentId?: string | null } =
		$props();

	let title = $state('');
	let targetDate = $state('');
	let goalType = $state<GoalType>('standard');
	let targetExercise = $state('');
	let targetValue = $state<number | null>(null);
	let targetUnit = $state('');
	let parent = $state('');
	// Wechselt das Elternziel (z. B. „Unterziel anlegen" bei einem anderen Ziel),
	// muss die Vorauswahl mitziehen — eine `$state`-Initialisierung tut das nicht.
	let hydratedFor = $state<string | null | undefined>(undefined);
	$effect(() => {
		if (parentId === hydratedFor) return;
		hydratedFor = parentId;
		parent = parentId ?? '';
	});

	import { verboteneEltern } from '../checkins';

	// Genau eine Ebene: nur nicht-erledigte, nicht-archivierte Ziele dürfen Eltern sein.
	const parentOptions = $derived(
		parentId
			? []
			: goalsState.goals.filter((g) => g.status !== 'done' && !g.archived && g.parent_id === null)
	);

	const types: { value: GoalType; label: string }[] = [
		{ value: 'standard', label: 'Standard' },
		{ value: 'target', label: '🎯 Zielwert' },
		{ value: 'pr', label: '🏋️ Kraft (PR)' },
		{ value: 'fitness_frequency', label: '📅 Frequenz' }
	];

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!title.trim()) return;
		await goalsState.addGoal({
			title,
			target_date: targetDate || null,
			parent_id: parent || null,
			goal_type: goalType,
			target_exercise: goalType === 'pr' ? targetExercise.trim() || null : null,
			target_value:
				goalType === 'pr' || goalType === 'fitness_frequency' || goalType === 'target'
					? targetValue
					: null,
			target_unit: goalType === 'target' ? targetUnit.trim() || null : null
		});
		title = '';
		targetDate = '';
		targetExercise = '';
		targetValue = null;
		targetUnit = '';
		goalType = 'standard';
		parent = parentId ?? '';
		onsubmitted?.();
	}
</script>

<form onsubmit={submit} class="flex flex-col gap-3">
	<Input placeholder="Neues Ziel…" bind:value={title} required />

	<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
		{#each types as t (t.value)}
			<button
				type="button"
				onclick={() => (goalType = t.value)}
				class="min-h-12 rounded-xl border px-2 text-xs font-medium transition-colors {goalType ===
				t.value
					? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400'
					: 'border-border-color bg-surface-1 text-text-secondary'}"
			>
				{t.label}
			</button>
		{/each}
	</div>

	{#if goalType === 'target'}
		<div class="flex gap-2">
			<div class="flex-1">
				<Input type="number" min="1" step="1" placeholder="Zielmenge" bind:value={targetValue} />
			</div>
			<div class="w-32">
				<Input placeholder="Einheit" maxlength={20} bind:value={targetUnit} />
			</div>
		</div>
	{:else if goalType === 'pr'}
		<div class="flex gap-2">
			<Input placeholder="Übung (z. B. Kreuzheben)" bind:value={targetExercise} />
			<div class="w-32">
				<Input type="number" min="1" step="0.5" placeholder="Ziel-1RM kg" bind:value={targetValue} />
			</div>
		</div>
	{:else if goalType === 'fitness_frequency'}
		<Input type="number" min="1" max="14" placeholder="Trainings/Woche" bind:value={targetValue} />
	{/if}

	{#if !parentId && parentOptions.length > 0}
		<Field label="Unterziel von" hint="Optional — macht dieses Ziel zum Meilenstein">
			<Select bind:value={parent}>
				<option value="">Kein Oberziel</option>
				{#each parentOptions as g (g.id)}
					<option value={g.id}>{g.title}</option>
				{/each}
			</Select>
		</Field>
	{/if}

	<Field label="Zieldatum" hint="Optional — Basis für die Auf-Kurs-Anzeige">
		<Input type="date" bind:value={targetDate} />
	</Field>

	<Button type="submit">
		{#snippet children()}
			Hinzufügen
		{/snippet}
	</Button>
</form>
