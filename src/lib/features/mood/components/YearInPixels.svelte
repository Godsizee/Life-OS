<script lang="ts">
	// W9 — Daylio „Year in Pixels": 12 Monatsspalten x 31 Tageszeilen auf dem Raster aus ui/charts.
	import { moodHex } from '../colors';
	import { MOOD_LABELS } from '../types';
	import { formatDate } from '#lib/core/date.js';
	import type { PixelMonth } from '../stats';
	import Raster from '#lib/ui/charts/Raster.svelte';
	import type { RasterZelle } from '#lib/ui/charts/raster-kern.js';

	let {
		months,
		onselect
	}: {
		months: PixelMonth[];
		onselect?: (date: string) => void;
	} = $props();

	const zellen = $derived<RasterZelle[]>(
		months.flatMap((month) =>
			month.days.flatMap((tag, zeile) =>
				tag
					? [
							{
								id: tag.date,
								spalte: month.month,
								zeile,
								farbe: tag.future || tag.score === null ? null : moodHex(tag.score),
								label: formatDate(tag.date, { day: 'numeric', month: 'long' }),
								text: tag.score ? MOOD_LABELS[tag.score] : 'kein Eintrag',
								gesperrt: tag.future
							}
						]
					: []
			)
		)
	);

	const eingetragen = $derived(zellen.filter((z) => z.farbe !== null).length);
</script>

<Raster
	spalten={12}
	zeilen={31}
	{zellen}
	zelle={14}
	spaltenLabels={months.map((m) => ({ index: m.month, text: m.label.slice(0, 1) }))}
	zeilenLabels={[1, 8, 15, 22, 29].map((tag) => ({ index: tag - 1, text: String(tag) }))}
	beschreibung="Stimmung im Jahresverlauf: {eingetragen} Tage mit Eintrag. Tippe auf einen Tag, um ihn nachzutragen."
	onwahl={onselect}
	tabellenKopf={['Tag', 'Stimmung']}
/>
