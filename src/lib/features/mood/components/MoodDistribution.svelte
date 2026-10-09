<script lang="ts">
	import { moodDistribution, type MoodLike } from '../stats';
	import { MOOD_LABELS } from '../types';
	import { moodHex } from '../colors';
	import Balken from '#lib/ui/charts/Balken.svelte';

	let { entries }: { entries: MoodLike[] } = $props();

	const dist = $derived(moodDistribution(entries));
	const total = $derived(dist.reduce((a, b) => a + b, 0));

	const daten = $derived(
		[5, 4, 3, 2, 1].map((score) => {
			const count = dist[score - 1];
			const percent = total === 0 ? 0 : Math.round((count / total) * 100);
			return {
				label: MOOD_LABELS[score],
				wert: count,
				text: `${count} (${percent} %)`,
				farbe: moodHex(score)
			};
		})
	);
</script>

<div class="space-y-2">
	<h3 class="mono-label text-text-3">Stimmungs-Verteilung</h3>
	<Balken
		{daten}
		max={Math.max(1, total)}
		beschreibung="Verteilung der Stimmungsstufen im Zeitraum, {total} Einträge"
	/>
</div>
