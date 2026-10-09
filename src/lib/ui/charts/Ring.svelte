<script lang="ts">
	import type { Snippet } from 'svelte';
	import { farbeVar, type ChartFarbe } from './farbe.js';
	import { ringMass, ringProzent, ringVersatz } from './ring-kern.js';

	let {
		wert,
		groesse = 88,
		strich = 7,
		farbe = 'signal',
		beschreibung,
		rahmen = true,
		text,
		unter,
		mitte
	}: {
		/** Fortschritt in Prozent (0 bis 100). */
		wert: number;
		/** Kantenlänge in Pixeln. */
		groesse?: number;
		/** Strichstärke in viewBox-Einheiten (7 ≈ 6 px bei 88 px). */
		strich?: number;
		farbe?: ChartFarbe;
		/** Pflicht: ein Satz mit dem Wert, z. B. „Wasser: 3 von 8 Gläsern“. */
		beschreibung: string;
		/** Rahmenlinien innen und außen. Bei sehr kleinen Ringen abschalten. */
		rahmen?: boolean;
		/** Große Zahl in der Mitte. */
		text?: string;
		/** Kleine Beschriftung darunter, in Mono. */
		unter?: string;
		/** Eigener Inhalt für die Mitte statt `text` und `unter`. */
		mitte?: Snippet;
	} = $props();

	const m = $derived(ringMass(strich));
	const textKlasse = $derived(
		groesse >= 120 ? 'text-5xl' : groesse >= 80 ? 'text-2xl' : groesse >= 56 ? 'text-lg' : 'text-xs'
	);
</script>

<div
	class="relative inline-flex shrink-0 items-center justify-center"
	style:width="{groesse}px"
	style:height="{groesse}px"
	role="img"
	aria-label={beschreibung}
>
	<svg class="-rotate-90" width={groesse} height={groesse} viewBox="0 0 100 100" aria-hidden="true">
		<circle cx="50" cy="50" r={m.r} fill="none" stroke="var(--flaeche-2)" stroke-width={strich} />
		<circle
			cx="50"
			cy="50"
			r={m.r}
			fill="none"
			stroke={farbeVar(farbe)}
			stroke-width={strich}
			stroke-dasharray={m.umfang}
			stroke-dashoffset={ringVersatz(m.umfang, wert)}
			class="transition-[stroke-dashoffset] duration-[var(--dauer-basis)]"
			style:opacity={ringProzent(wert) === 0 ? 0 : 1}
		/>
		{#if rahmen}
			<circle cx="50" cy="50" r={m.aussen} fill="none" stroke="var(--tinte)" stroke-width="2" />
			<circle cx="50" cy="50" r={m.innen} fill="none" stroke="var(--tinte)" stroke-width="2" />
		{/if}
	</svg>
	<div
		class="absolute inset-0 flex flex-col items-center justify-center text-center"
		aria-hidden="true"
	>
		{#if mitte}
			{@render mitte()}
		{:else}
			{#if text !== undefined}
				<span class="leading-none font-extrabold tracking-tight tabular-nums {textKlasse}"
					>{text}</span
				>
			{/if}
			{#if unter && groesse >= 56}
				<span class="mono-label mt-0.5 text-text-3">{unter}</span>
			{/if}
		{/if}
	</div>
</div>
