<script lang="ts">
	// W9 — Ø-Stimmung je Wochentag als senkrechte Balken (ui/charts/Balken).
	import { averageByWeekday, formatScore, WEEKDAY_SHORT, type MoodLike } from '../stats';
	import { moodHex } from '../colors';
	import Balken from '#lib/ui/charts/Balken.svelte';

	let { entries }: { entries: MoodLike[] } = $props();

	const averages = $derived(averageByWeekday(entries));
	const daten = $derived(
		averages.map((avg, i) => ({
			label: WEEKDAY_SHORT[i],
			wert: avg,
			text: formatScore(avg),
			farbe: avg === null ? undefined : moodHex(Math.round(avg))
		}))
	);
</script>

<Balken
	{daten}
	richtung="vertikal"
	max={5}
	hoehe={120}
	beschreibung="Durchschnittliche Stimmung je Wochentag auf einer Skala von 1 bis 5"
	leerText="Noch keine Einträge für einen Wochentag."
/>
