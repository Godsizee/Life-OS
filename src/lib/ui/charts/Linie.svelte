<script lang="ts">
	import ChartRahmen from './ChartRahmen.svelte';
	import { farbeVar, type ChartFarbe } from './farbe.js';
	import { koordinaten, pfad, wertebereich, yPos, type LiniePunkt } from './linie-kern.js';

	let {
		punkte,
		vergleich,
		ziel,
		formatWert = (v: number) => String(v),
		farbe = 'signal',
		beschreibung,
		min,
		max,
		hoehe = 96,
		kompakt = false,
		leerText = 'Noch keine Daten.'
	}: {
		punkte: LiniePunkt[];
		/** Zweite, gestrichelte Reihe (z. B. Vergleichszeitraum). */
		vergleich?: LiniePunkt[];
		/** Waagerechte Zielmarke. */
		ziel?: number;
		formatWert?: (v: number) => string;
		farbe?: ChartFarbe;
		/** Pflicht: ein Satz, was das Diagramm zeigt (`aria-label` und Tabellenüberschrift). */
		beschreibung: string;
		/** Feste Achsenenden, z. B. 0 und 100 für einen Score. */
		min?: number;
		max?: number;
		hoehe?: number;
		/** Sparkline: ohne Beschriftung und ohne Tabelle. */
		kompakt?: boolean;
		leerText?: string;
	} = $props();

	const BREITE = 320;
	const mass = $derived({ breite: BREITE, hoehe, rand: kompakt ? 6 : 8 });

	const bereich = $derived(
		wertebereich(
			[punkte.map((p) => p.value), vergleich ? vergleich.map((p) => p.value) : []],
			ziel === undefined ? [] : [ziel],
			{ min, max }
		)
	);
	const koords = $derived(koordinaten(punkte, bereich, mass));
	const linie = $derived(pfad(koords));
	const vergleichsLinie = $derived(vergleich ? pfad(koordinaten(vergleich, bereich, mass)) : '');
	const zielY = $derived(ziel === undefined ? null : yPos(ziel, bereich, mass));

	const hatWerte = $derived(punkte.some((p) => p.value !== null));
	const letzter = $derived(
		[...punkte].reverse().find((p): p is LiniePunkt & { value: number } => p.value !== null)
	);

	let hover = $state<number | null>(null);
	const gezeigt = $derived(
		hover !== null && punkte[hover]?.value != null
			? (punkte[hover] as LiniePunkt & { value: number })
			: letzter
	);

	const tabelle = $derived({
		kopf: vergleich ? ['Zeitpunkt', 'Wert', 'Vergleich'] : ['Zeitpunkt', 'Wert'],
		zeilen: punkte.map((p, i) => {
			const zeile = [p.label, p.value === null ? 'kein Wert' : formatWert(p.value)];
			if (vergleich) {
				const v = vergleich[i]?.value;
				zeile.push(v == null ? 'kein Wert' : formatWert(v));
			}
			return zeile;
		})
	});
</script>

{#if !hatWerte}
	<p class="mono-label text-text-3">{leerText}</p>
{:else}
	<ChartRahmen {beschreibung} tabelle={kompakt ? undefined : tabelle}>
		<svg
			viewBox="0 0 {BREITE} {hoehe}"
			class="block h-auto w-full overflow-visible"
			role="img"
			aria-label={beschreibung}
		>
			<line
				x1="0"
				y1={hoehe - 1}
				x2={BREITE}
				y2={hoehe - 1}
				stroke="var(--tinte)"
				stroke-width="2"
				vector-effect="non-scaling-stroke"
			/>
			{#if zielY !== null}
				<line
					x1="0"
					y1={zielY}
					x2={BREITE}
					y2={zielY}
					stroke="var(--text-3)"
					stroke-width="2"
					stroke-dasharray="6 4"
					vector-effect="non-scaling-stroke"
				/>
			{/if}
			{#if vergleichsLinie}
				<path
					d={vergleichsLinie}
					fill="none"
					stroke="var(--text-3)"
					stroke-width="2"
					stroke-dasharray="6 4"
					vector-effect="non-scaling-stroke"
				/>
			{/if}
			<path
				d={linie}
				fill="none"
				stroke={farbeVar(farbe)}
				stroke-width="3"
				stroke-linecap="square"
				vector-effect="non-scaling-stroke"
			/>
			<!-- Der Rand der Linie in Tinte, damit sie auf jeder Fläche steht. -->
			<path
				d={linie}
				fill="none"
				stroke="var(--tinte)"
				stroke-width="1"
				stroke-linecap="square"
				vector-effect="non-scaling-stroke"
			/>
			{#each koords as k, i (i)}
				{#if k}
					<rect
						x={k.x - (hover === i ? 5 : 4)}
						y={k.y - (hover === i ? 5 : 4)}
						width={hover === i ? 10 : 8}
						height={hover === i ? 10 : 8}
						fill={farbeVar(farbe)}
						stroke="var(--tinte)"
						stroke-width="2"
						vector-effect="non-scaling-stroke"
						role="presentation"
						onmouseenter={() => (hover = i)}
						onmouseleave={() => (hover = null)}
					>
						<title>{punkte[i].label}: {formatWert(punkte[i].value as number)}</title>
					</rect>
				{/if}
			{/each}
		</svg>
		{#if !kompakt}
			<div class="mono-label mt-1 flex items-center justify-between gap-2 text-text-3">
				<span>{punkte[0]?.label}</span>
				<span>{punkte[punkte.length - 1]?.label}</span>
			</div>
			{#if gezeigt}
				<p class="mt-1 text-sm text-text-2">
					<span class="font-semibold text-tinte">{gezeigt.label}</span>
					<span class="mono-label">· {formatWert(gezeigt.value)}</span>
					{#if ziel !== undefined}<span class="mono-label text-text-3"
							>· ZIEL {formatWert(ziel)}</span
						>{/if}
				</p>
			{/if}
		{/if}
	</ChartRahmen>
{/if}
