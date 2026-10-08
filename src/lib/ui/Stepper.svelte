<script lang="ts">
	import { Minus, Plus } from '@lucide/svelte';

	let {
		value,
		limits,
		suffix,
		label = 'Wert',
		onchange
	}: {
		value: number;
		limits: { min: number; max: number; step: number };
		suffix?: string;
		/** Zugänglicher Name des Zahlenfelds (die Zeile daneben nennt den Zweck). */
		label?: string;
		onchange: (next: number) => void;
	} = $props();

	const id = $props.id();

	// Auf das Raster des Schritts runden, damit 0,1 + 0,2 nicht als 0,30000000000000004 landet.
	const nachkommastellen = $derived((String(limits.step).split('.')[1] ?? '').length);
	const klemme = (n: number) => Math.min(limits.max, Math.max(limits.min, n));
	const runde = (n: number) => Number(klemme(n).toFixed(nachkommastellen));

	function schritt(richtung: 1 | -1) {
		onchange(runde(value + richtung * limits.step));
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			event.preventDefault();
			schritt(event.key === 'ArrowUp' ? 1 : -1);
		}
	}

	const knopf =
		'flex h-[var(--ziel-min)] w-[var(--ziel-min)] shrink-0 items-center justify-center bg-flaeche text-tinte hover:bg-flaeche-2 disabled:opacity-40';
</script>

<div class="flex items-center gap-2">
	<div class="flex rounded-md border-[length:var(--rahmen-s)] border-tinte">
		<button
			type="button"
			class="{knopf} rounded-l-[calc(var(--kante-m)-var(--rahmen-s))]"
			aria-label="{label} verringern"
			aria-controls={id}
			disabled={value <= limits.min}
			onclick={() => schritt(-1)}
		>
			<Minus size={18} />
		</button>
		<!-- Natives Zahlenfeld: Spinbutton-Rolle, Tippen bleibt möglich (z. B. 72,5 kg). -->
		<input
			{id}
			type="number"
			inputmode={nachkommastellen > 0 ? 'decimal' : 'numeric'}
			min={limits.min}
			max={limits.max}
			step={limits.step}
			value={String(value)}
			aria-label={label}
			{onkeydown}
			onchange={(e) => onchange(runde(Number((e.currentTarget as HTMLInputElement).value)))}
			class="nums-tabular min-h-[var(--ziel-min)] w-20 min-w-0 [appearance:textfield] border-x-[length:var(--rahmen-s)] border-tinte bg-flaeche text-center font-mono text-base font-semibold text-tinte [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
		/>
		<button
			type="button"
			class="{knopf} rounded-r-[calc(var(--kante-m)-var(--rahmen-s))]"
			aria-label="{label} erhöhen"
			aria-controls={id}
			disabled={value >= limits.max}
			onclick={() => schritt(1)}
		>
			<Plus size={18} />
		</button>
	</div>
	{#if suffix}<span class="mono-label text-text-2">{suffix}</span>{/if}
</div>
