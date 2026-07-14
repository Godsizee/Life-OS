<script lang="ts">
	// F5 — Set-Grid touch-tauglich: großer +/− Stepper statt rohem <input type="number">.
	// Tasten sind 44px hoch (Tap-Ziel), das Zahlenfeld bleibt frei editierbar (Tastatur/
	// Feinkorrektur). Wert ist nullable — leer bedeutet „nicht gesetzt" (z. B. Bodyweight).
	import { Minus, Plus } from 'lucide-svelte';

	let {
		value = $bindable(),
		step = 1,
		min = 0,
		placeholder = '',
		unit = '',
		label = ''
	}: {
		value: number | null;
		step?: number;
		min?: number;
		placeholder?: string;
		unit?: string;
		label?: string;
	} = $props();

	// Nachkommastellen aus dem Step ableiten, damit 2.5 kg nicht als 2.5000001 landet.
	const decimals = $derived((String(step).split('.')[1] ?? '').length);
	function round(n: number): number {
		return Math.round(n * 10 ** decimals) / 10 ** decimals;
	}
	function inc() {
		value = round((value ?? 0) + step);
	}
	function dec() {
		const next = round((value ?? 0) - step);
		value = next < min ? min : next;
	}
</script>

<div
	data-noswipe
	class="flex items-center overflow-hidden rounded-lg border border-border-color bg-surface-0"
>
	<button
		type="button"
		onclick={dec}
		aria-label="{label} verringern"
		class="flex h-11 w-8 shrink-0 items-center justify-center text-text-secondary active:bg-surface-2"
	>
		<Minus size={14} />
	</button>
	<input
		type="number"
		inputmode="decimal"
		bind:value
		{placeholder}
		{step}
		aria-label={label}
		class="h-11 w-12 min-w-0 border-x border-border-color bg-transparent text-center text-sm text-text-primary focus:outline-none"
	/>
	<button
		type="button"
		onclick={inc}
		aria-label="{label} erhöhen"
		class="flex h-11 w-8 shrink-0 items-center justify-center text-text-secondary active:bg-surface-2"
	>
		<Plus size={14} />
	</button>
	{#if unit}
		<span class="px-1.5 text-[11px] font-medium text-text-tertiary">{unit}</span>
	{/if}
</div>
