<script lang="ts">
	import Select from '$lib/ui/Select.svelte';
	import { formatRRule } from '../recurrence';

	let { id, value, onchange }: { id?: string; value: string | null; onchange: (next: string | null) => void } = $props();

	// Genau die drei Regeln, die expandNextOccurrence() auswerten kann —
	// mehr anzubieten würde eine Wiederholung versprechen, die nie feuert.
	const optionen = [
		{ v: '',              label: 'Einmalig' },
		{ v: 'FREQ=DAILY',    label: 'Täglich' },
		{ v: 'FREQ=WEEKLY',   label: 'Wöchentlich' },
		{ v: 'FREQ=MONTHLY',  label: 'Monatlich' }
	];
</script>

<Select {id} value={value ?? ''} onchange={(e) => onchange((e.currentTarget as HTMLSelectElement).value || null)}>
	{#each optionen as o (o.v)}<option value={o.v}>{o.label}</option>{/each}
</Select>
{#if value}
	<p class="mt-1 text-xs text-text-tertiary">
		Nach dem Abhaken wird automatisch die nächste Aufgabe angelegt ({formatRRule(value)}).
	</p>
{/if}
