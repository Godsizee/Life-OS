<script lang="ts">
	// Trainingsfrequenz der letzten 12 Wochen: binär (Training ja/nein) auf dem Raster aus ui/charts.
	import { fromISODate, formatTagKurz, toISODate } from '#lib/core/date.js';
	import Raster from '#lib/ui/charts/Raster.svelte';
	import { monatsLabels, type RasterZelle } from '#lib/ui/charts/raster-kern.js';

	let { logDates }: { logDates: string[] } = $props();
	const geloggt = $derived(new Set(logDates));

	const WOCHEN = 12;
	const TAGE = WOCHEN * 7;

	const heute = new Date();
	const heuteIso = toISODate(heute);
	const start = new Date(heute);
	start.setDate(heute.getDate() - TAGE + 1);

	const tage: string[] = Array.from({ length: TAGE }, (_, i) => {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		return toISODate(d);
	});
	const wochen: string[][] = Array.from({ length: WOCHEN }, (_, w) => tage.slice(w * 7, w * 7 + 7));

	const zellen = $derived<RasterZelle[]>(
		tage.map((tag, i) => {
			const trainiert = geloggt.has(tag);
			const datum = fromISODate(tag);
			return {
				id: tag,
				spalte: Math.floor(i / 7),
				zeile: i % 7,
				farbe: trainiert ? 'var(--mod-fitness)' : null,
				label: datum ? formatTagKurz(datum) : tag,
				text: trainiert ? 'Training absolviert' : 'kein Training',
				heute: tag === heuteIso
			};
		})
	);
</script>

<Raster
	spalten={WOCHEN}
	zeilen={7}
	{zellen}
	spaltenLabels={monatsLabels(wochen)}
	beschreibung="Trainingstage der letzten {WOCHEN} Wochen: {logDates.filter((d) => tage.includes(d))
		.length} Tage mit Training"
	legende={[
		{ farbe: null, text: 'Kein Training' },
		{ farbe: 'var(--mod-fitness)', text: 'Training' }
	]}
	tabellenKopf={['Tag', 'Training']}
/>
