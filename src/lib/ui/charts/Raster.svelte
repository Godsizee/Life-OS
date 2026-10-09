<script lang="ts">
	import ChartRahmen from './ChartRahmen.svelte';
	import type { RasterZelle, RasterLabel, RasterLegende } from './raster-kern.js';
	import { rasterMass } from './raster-kern.js';

	let {
		spalten,
		zeilen,
		zellen,
		spaltenLabels = [],
		zeilenLabels = [],
		zelle = 11,
		abstand = 2,
		beschreibung,
		onwahl,
		legende = [],
		tabellenKopf = ['Tag', 'Wert']
	}: {
		spalten: number;
		zeilen: number;
		zellen: RasterZelle[];
		/** Beschriftung über den Spalten (z. B. Monate). */
		spaltenLabels?: RasterLabel[];
		/** Beschriftung links der Zeilen (z. B. Tage). */
		zeilenLabels?: RasterLabel[];
		/** Kantenlänge einer Zelle in Pixeln. */
		zelle?: number;
		abstand?: number;
		/** Pflicht: ein Satz, was das Raster zeigt. */
		beschreibung: string;
		/** Mit Handler sind die Zellen Tasten (Enter/Leertaste). */
		onwahl?: (id: string) => void;
		legende?: RasterLegende[];
		tabellenKopf?: string[];
	} = $props();

	const mass = $derived(
		rasterMass(spalten, zeilen, {
			zelle,
			abstand,
			kopf: spaltenLabels.length > 0 ? 16 : 0,
			links: zeilenLabels.length > 0 ? 20 : 0
		})
	);

	let gewaehlt = $state<RasterZelle | null>(null);

	const tabelle = $derived({
		kopf: tabellenKopf,
		zeilen: zellen.map((z) => [z.label, z.text])
	});

	function taste(e: KeyboardEvent, z: RasterZelle) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onwahl?.(z.id);
		}
	}
</script>

<ChartRahmen {beschreibung} {tabelle}>
	<div class="max-w-full overflow-x-auto pb-1">
		<svg
			width={mass.breite}
			height={mass.hoehe}
			viewBox="0 0 {mass.breite} {mass.hoehe}"
			class="block overflow-visible"
			role={onwahl ? 'group' : 'img'}
			aria-label={beschreibung}
		>
			{#each spaltenLabels as l (l.index)}
				<text
					x={mass.links + l.index * mass.schritt}
					y={mass.kopf - 5}
					font-size="10"
					fill="var(--text-3)"
					font-family="var(--font-mono)">{l.text}</text
				>
			{/each}
			{#each zeilenLabels as l (l.index)}
				<text
					x={mass.links - 5}
					y={mass.kopf + l.index * mass.schritt + zelle - 2}
					font-size="10"
					text-anchor="end"
					fill="var(--text-3)"
					font-family="var(--font-mono)">{l.text}</text
				>
			{/each}
			{#each zellen as z (z.id)}
				{#if onwahl}
					<rect
						x={mass.links + z.spalte * mass.schritt}
						y={mass.kopf + z.zeile * mass.schritt}
						width={zelle}
						height={zelle}
						fill={z.farbe ?? 'var(--flaeche-2)'}
						stroke="var(--tinte)"
						stroke-opacity={z.heute ? 1 : 0.35}
						stroke-width={z.heute ? 2 : 1}
						class={z.gesperrt ? '' : 'cursor-pointer hover:opacity-80 focus-visible:opacity-80'}
						role="button"
						tabindex={z.gesperrt ? -1 : 0}
						aria-disabled={z.gesperrt === true}
						aria-label="{z.label}: {z.text}"
						onmouseenter={() => (gewaehlt = z)}
						onmouseleave={() => (gewaehlt = null)}
						onfocus={() => (gewaehlt = z)}
						onblur={() => (gewaehlt = null)}
						onclick={() => !z.gesperrt && onwahl(z.id)}
						onkeydown={(e) => !z.gesperrt && taste(e, z)}
					>
						<title>{z.label}: {z.text}</title>
					</rect>
				{:else}
					<rect
						x={mass.links + z.spalte * mass.schritt}
						y={mass.kopf + z.zeile * mass.schritt}
						width={zelle}
						height={zelle}
						fill={z.farbe ?? 'var(--flaeche-2)'}
						stroke="var(--tinte)"
						stroke-opacity={z.heute ? 1 : 0.35}
						stroke-width={z.heute ? 2 : 1}
						role="presentation"
						onmouseenter={() => (gewaehlt = z)}
						onmouseleave={() => (gewaehlt = null)}
					>
						<title>{z.label}: {z.text}</title>
					</rect>
				{/if}
			{/each}
		</svg>
	</div>

	{#if gewaehlt}
		<p class="mt-1 text-sm text-text-2">
			<span class="font-semibold text-tinte">{gewaehlt.label}</span>
			<span class="mono-label">· {gewaehlt.text}</span>
		</p>
	{/if}

	{#if legende.length > 0}
		<ul class="m-0 mt-2 flex list-none flex-wrap items-center gap-x-3 gap-y-1 p-0">
			{#each legende as l (l.text)}
				<li class="mono-label inline-flex items-center gap-1.5 text-text-2">
					<span
						class="inline-block h-3 w-3 border border-tinte"
						style:background-color={l.farbe ?? 'var(--flaeche-2)'}
						aria-hidden="true"
					></span>
					{l.text}
				</li>
			{/each}
		</ul>
	{/if}
</ChartRahmen>
