<script lang="ts">
	import type { RecurrenceForm, Freq, Ende } from '../rrule';
	import { formatRecurrence, buildRrule } from '../rrule';
	import Chip from '$lib/ui/Chip.svelte';

	let {
		value = $bindable()
	}: {
		value: RecurrenceForm;
	} = $props();

	const Wochentage = [
		{ label: 'Mo', idx: 1 },
		{ label: 'Di', idx: 2 },
		{ label: 'Mi', idx: 3 },
		{ label: 'Do', idx: 4 },
		{ label: 'Fr', idx: 5 },
		{ label: 'Sa', idx: 6 },
		{ label: 'So', idx: 0 }
	];

	function toggleDay(idx: number) {
		if (value.byday.includes(idx)) {
			value.byday = value.byday.filter(d => d !== idx);
		} else {
			value.byday = [...value.byday, idx];
		}
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Frequenz -->
	<div>
		<label for="freq-select" class="mb-1 block text-sm font-medium text-text-secondary">Wiederholung</label>
		<select
			id="freq-select"
			bind:value={value.freq}
			class="w-full rounded-xl border border-border-color bg-surface-0 px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
		>
			<option value="none">Einmalig (Nie)</option>
			<option value="daily">Täglich</option>
			<option value="weekly">Wöchentlich</option>
			<option value="monthly">Monatlich</option>
		</select>
	</div>

	{#if value.freq !== 'none'}
		<!-- Intervall -->
		<div class="flex items-center gap-2">
			<span class="text-sm text-text-secondary">Alle</span>
			<input
				type="number"
				min="1"
				max="99"
				bind:value={value.interval}
				class="w-16 rounded-xl border border-border-color bg-surface-0 px-2 py-1 text-center text-sm focus:border-primary-500 focus:outline-none"
			/>
			<span class="text-sm text-text-secondary">
				{value.freq === 'daily' ? 'Tage' : value.freq === 'weekly' ? 'Wochen' : 'Monate'}
			</span>
		</div>

		<!-- Wochentage (nur bei weekly) -->
		{#if value.freq === 'weekly'}
			<div class="flex flex-wrap gap-1">
				{#each Wochentage as { label, idx }}
					<Chip selected={value.byday.includes(idx)} onclick={() => toggleDay(idx)}>
						{label}
					</Chip>
				{/each}
			</div>
			{#if value.byday.length === 0}
				<span class="text-xs text-text-tertiary">Ohne Wahl wird der Starttag der Serie verwendet.</span>
			{/if}
		{/if}

		<!-- Ende -->
		<div class="mt-2 flex flex-col gap-2 rounded-xl border border-border-color bg-surface-0 p-3">
			<span class="text-sm font-medium text-text-secondary">Ende</span>
			
			<label class="flex items-center gap-2 text-sm text-text-primary">
				<input type="radio" name="ende" value="nie" bind:group={value.ende} class="text-primary-600" />
				Nie
			</label>
			
			<label class="flex items-center gap-2 text-sm text-text-primary">
				<input type="radio" name="ende" value="am" bind:group={value.ende} class="text-primary-600" />
				Am
				<input
					type="date"
					bind:value={value.until}
					disabled={value.ende !== 'am'}
					class="rounded-lg border border-border-color bg-surface-1 px-2 py-1 text-sm disabled:opacity-50 focus:border-primary-500 focus:outline-none"
				/>
			</label>
			
			<label class="flex items-center gap-2 text-sm text-text-primary">
				<input type="radio" name="ende" value="nach" bind:group={value.ende} class="text-primary-600" />
				Nach
				<input
					type="number"
					min="1"
					bind:value={value.count}
					disabled={value.ende !== 'nach'}
					class="w-16 rounded-lg border border-border-color bg-surface-1 px-2 py-1 text-center text-sm disabled:opacity-50 focus:border-primary-500 focus:outline-none"
				/>
				Terminen
			</label>
		</div>

		<!-- Vorschau -->
		<div class="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400">
			Vorschau: {formatRecurrence(buildRrule(value))}
		</div>
	{/if}
</div>
