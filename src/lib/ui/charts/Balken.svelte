<script lang="ts">
	import ChartRahmen from './ChartRahmen.svelte';
	import { farbeVar, type ChartFarbe } from './farbe.js';

	interface BalkenDatum {
		label: string;
		/** null = kein Wert (leere Spalte bzw. Zeile). */
		wert: number | null;
		/** Anzeigetext des Werts. Ohne Angabe gilt `formatWert`. */
		text?: string;
		/** Eigene Füllfarbe, z. B. für Stimmungsstufen (CSS-Farbe, Token bevorzugt). */
		farbe?: string;
	}

	let {
		daten,
		richtung = 'horizontal',
		max,
		formatWert = (v: number) => String(v),
		farbe = 'signal',
		beschreibung,
		hoehe = 96,
		leerText = 'Keine Daten im Zeitraum.'
	}: {
		daten: BalkenDatum[];
		richtung?: 'horizontal' | 'vertikal';
		/** Wert, bei dem der Balken voll ist. Ohne Angabe gilt der größte Wert. */
		max?: number;
		formatWert?: (v: number) => string;
		farbe?: ChartFarbe;
		/** Pflicht: ein Satz, was das Diagramm zeigt. */
		beschreibung: string;
		/** Höhe der Spalten bei `vertikal`. */
		hoehe?: number;
		leerText?: string;
	} = $props();

	const obergrenze = $derived(max ?? Math.max(1, ...daten.map((d) => d.wert ?? 0)));
	const anteil = (wert: number | null) =>
		wert === null ? 0 : Math.max(0, Math.min(100, (wert / obergrenze) * 100));
	const anzeige = (d: BalkenDatum) => d.text ?? (d.wert === null ? '–' : formatWert(d.wert));
	const fuellung = (d: BalkenDatum) => d.farbe ?? farbeVar(farbe);

	const hatWerte = $derived(daten.some((d) => d.wert !== null && d.wert > 0));
	const tabelle = $derived({
		kopf: ['Eintrag', 'Wert'],
		zeilen: daten.map((d) => [d.label, anzeige(d)])
	});
</script>

{#if !hatWerte}
	<p class="mono-label text-text-3">{leerText}</p>
{:else}
	<ChartRahmen {beschreibung} {tabelle}>
		{#if richtung === 'horizontal'}
			<ul class="m-0 flex list-none flex-col gap-2 p-0" aria-label={beschreibung}>
				{#each daten as d (d.label)}
					<li
						class="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)_auto] items-center gap-2 xs:grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto]"
					>
						<span class="mono-label truncate text-tinte">{d.label}</span>
						<span
							class="block h-5 border-[length:var(--rahmen-s)] border-tinte bg-flaeche-2"
							aria-hidden="true"
						>
							<span
								class="block h-full border-r-[length:var(--rahmen-s)] border-tinte"
								style:width="{anteil(d.wert)}%"
								style:background-color={fuellung(d)}
								style:border-right-width={anteil(d.wert) === 0 ? '0' : undefined}
							></span>
						</span>
						<span class="mono-label min-w-12 text-right tabular-nums">{anzeige(d)}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<ul
				class="m-0 flex list-none items-end justify-between gap-1.5 p-0"
				style:height="{hoehe}px"
				aria-label={beschreibung}
			>
				{#each daten as d (d.label)}
					<li class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
						<span class="mono-label text-text-2 tabular-nums">{anzeige(d)}</span>
						<span
							class="block w-full border-[length:var(--rahmen-s)] border-b-0 border-tinte"
							style:height="{d.wert === null
								? 0
								: Math.max(4, anteil(d.wert) * ((hoehe - 40) / 100))}px"
							style:background-color={d.wert === null ? 'transparent' : fuellung(d)}
							style:border-width={d.wert === null ? '0' : undefined}
							aria-hidden="true"
						></span>
						<span class="mono-label border-t-[length:var(--rahmen-s)] border-tinte pt-1 text-tinte"
							>{d.label}</span
						>
					</li>
				{/each}
			</ul>
		{/if}
	</ChartRahmen>
{/if}
