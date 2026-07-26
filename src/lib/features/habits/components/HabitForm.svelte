<script lang="ts">
	import { habitsState } from '../store.svelte';
	import type { Habit, HabitSchedule } from '../types';

	interface Props {
		initialData?: Habit;
		onsubmitted?: () => void;
		oncancel?: () => void;
	}

	let { initialData, onsubmitted, oncancel }: Props = $props();

	let name = $state(initialData?.name ?? '');

	// Typ des Rhythmus: 'daily', 'weekly', 'weekly_count'
	let scheduleType = $state<HabitSchedule['type']>(initialData?.schedule.type ?? 'daily');

	// Für 'weekly': Welche Wochentage (0=So, 1=Mo, ...)
	let selectedDays = $state<number[]>(
		initialData?.schedule.type === 'weekly' ? initialData.schedule.days : [1, 2, 3, 4, 5]
	);

	// Für 'weekly_count': Wie oft pro Woche
	let weeklyTimes = $state<number>(
		initialData?.schedule.type === 'weekly_count' ? initialData.schedule.times : 3
	);

	// W5: Mengen-Routinen
	let isQuantity = $state(
		initialData?.target_value !== null && initialData?.target_value !== undefined
	);
	let targetValue = $state<number>(initialData?.target_value ?? 5);
	let unit = $state(initialData?.unit ?? 'Gläser');

	let loading = $state(false);

	const WEEKDAYS = [
		{ id: 1, label: 'Mo' },
		{ id: 2, label: 'Di' },
		{ id: 3, label: 'Mi' },
		{ id: 4, label: 'Do' },
		{ id: 5, label: 'Fr' },
		{ id: 6, label: 'Sa' },
		{ id: 0, label: 'So' }
	];

	function toggleDay(id: number) {
		if (selectedDays.includes(id)) {
			// Mindestens ein Tag muss ausgewählt bleiben
			if (selectedDays.length > 1) {
				selectedDays = selectedDays.filter((d) => d !== id);
			}
		} else {
			selectedDays = [...selectedDays, id];
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) return;

		let schedule: HabitSchedule;
		if (scheduleType === 'daily') {
			schedule = { type: 'daily' };
		} else if (scheduleType === 'weekly_count') {
			schedule = { type: 'weekly_count', times: weeklyTimes };
		} else {
			schedule = { type: 'weekly', days: selectedDays };
		}

		loading = true;
		try {
			const payload = {
				name: name.trim(),
				schedule,
				target_value: isQuantity ? targetValue : null,
				unit: isQuantity ? unit.trim() : null
			};

			if (initialData) {
				await habitsState.updateHabit(initialData.id, payload);
			} else {
				await habitsState.addHabit(payload);
			}
			if (onsubmitted) onsubmitted();
			// Reset if creating new
			if (!initialData) {
				name = '';
				scheduleType = 'daily';
				isQuantity = false;
				targetValue = 5;
				unit = 'Gläser';
			}
		} finally {
			loading = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-4">
	<label class="flex flex-col gap-1.5">
		<span class="text-sm font-semibold text-text-primary">Name der Routine</span>
		<input
			type="text"
			bind:value={name}
			placeholder="z.B. Trinken, Lesen, Joggen..."
			required
			class="h-12 w-full rounded-xl border border-border-color bg-surface-0 px-4 text-base text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none premium-shadow"
		/>
	</label>

	<!-- W5: Mengen-Routinen Toggle -->
	<label class="flex items-center gap-3 rounded-xl border border-border-color bg-surface-0 p-3 premium-shadow">
		<input type="checkbox" bind:checked={isQuantity} class="h-5 w-5 rounded border-border-color text-primary-600 focus:ring-primary-500" />
		<div class="flex flex-col">
			<span class="text-sm font-semibold text-text-primary">Ziel-Menge festlegen</span>
			<span class="text-xs text-text-secondary">Statt einfachem Häkchen (z. B. 8 Gläser)</span>
		</div>
	</label>

	{#if isQuantity}
		<div class="flex gap-3">
			<label class="flex flex-1 flex-col gap-1.5">
				<span class="text-xs font-semibold text-text-secondary">Anzahl</span>
				<input
					type="number"
					bind:value={targetValue}
					min="2"
					max="10000"
					required
					class="h-12 w-full rounded-xl border border-border-color bg-surface-0 px-4 text-base text-text-primary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none premium-shadow"
				/>
			</label>
			<label class="flex flex-2 flex-col gap-1.5" style="flex: 2;">
				<span class="text-xs font-semibold text-text-secondary">Einheit</span>
				<input
					type="text"
					bind:value={unit}
					placeholder="z. B. Gläser, Seiten..."
					required
					class="h-12 w-full rounded-xl border border-border-color bg-surface-0 px-4 text-base text-text-primary placeholder:text-text-tertiary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none premium-shadow"
				/>
			</label>
		</div>
	{/if}

	<!-- Rhythmus -->
	<div class="flex flex-col gap-1.5">
		<span class="text-sm font-semibold text-text-primary">Rhythmus</span>
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => (scheduleType = 'daily')}
				class="h-10 flex-1 rounded-xl border font-medium transition-all {scheduleType === 'daily'
					? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30'
					: 'border-border-color bg-surface-0 text-text-secondary'}"
			>
				Täglich
			</button>
			<button
				type="button"
				onclick={() => (scheduleType = 'weekly_count')}
				class="h-10 flex-1 rounded-xl border font-medium transition-all {scheduleType === 'weekly_count'
					? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30'
					: 'border-border-color bg-surface-0 text-text-secondary'}"
			>
				x-mal/Woche
			</button>
			<button
				type="button"
				onclick={() => (scheduleType = 'weekly')}
				class="h-10 flex-1 rounded-xl border font-medium transition-all {scheduleType === 'weekly'
					? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30'
					: 'border-border-color bg-surface-0 text-text-secondary'}"
			>
				Tage wählen
			</button>
		</div>
	</div>

	<!-- Spezifische Einstellungen je Rhythmus -->
	{#if scheduleType === 'weekly_count'}
		<label class="flex flex-col gap-1.5">
			<span class="text-xs font-semibold text-text-secondary">Wie oft pro Woche?</span>
			<select
				bind:value={weeklyTimes}
				class="h-12 w-full rounded-xl border border-border-color bg-surface-0 px-4 text-base text-text-primary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none premium-shadow"
			>
				{#each [1, 2, 3, 4, 5, 6] as times}
					<option value={times}>{times} mal</option>
				{/each}
			</select>
		</label>
	{:else if scheduleType === 'weekly'}
		<div class="flex justify-between gap-1">
			{#each WEEKDAYS as day}
				{@const active = selectedDays.includes(day.id)}
				<button
					type="button"
					onclick={() => toggleDay(day.id)}
					class="flex h-10 w-10 flex-col items-center justify-center rounded-lg border font-medium transition-all {active
						? 'border-primary-500 bg-primary-500 text-white'
						: 'border-border-color bg-surface-0 text-text-secondary hover:bg-surface-1'}"
				>
					{day.label}
				</button>
			{/each}
		</div>
	{/if}

	<div class="mt-4 flex gap-3">
		{#if oncancel}
			<button
				type="button"
				onclick={oncancel}
				disabled={loading}
				class="h-12 flex-1 rounded-xl border border-border-color bg-surface-0 font-bold text-text-secondary transition-colors hover:bg-surface-1 disabled:opacity-50"
			>
				Abbrechen
			</button>
		{/if}
		<button
			type="submit"
			disabled={loading || !name.trim()}
			class="h-12 flex-1 rounded-xl bg-primary-600 font-bold text-white transition-colors active:bg-primary-700 disabled:opacity-50"
		>
			{loading ? 'Speichere...' : initialData ? 'Aktualisieren' : 'Routine erstellen'}
		</button>
	</div>
</form>
