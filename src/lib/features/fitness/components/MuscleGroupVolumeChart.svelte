<script lang="ts">
	// Wochen-Volumen pro Muskelgruppe als Balken (ui/charts/Balken).
	import Balken from '#lib/ui/charts/Balken.svelte';
	import type { MuscleGroupVolume } from '../utils/volume';

	let { data }: { data: MuscleGroupVolume[] } = $props();

	const daten = $derived(data.map((d) => ({ label: d.muscleGroup, wert: d.volumeKg })));
</script>

<Balken
	{daten}
	farbe="fitness"
	formatWert={(v) => `${v.toLocaleString('de-DE')} kg`}
	beschreibung="Trainingsvolumen dieser Woche je Muskelgruppe in Kilogramm"
	leerText="Noch kein Kraft-Volumen diese Woche (nur Übungen aus dem Katalog zählen für die Muskelgruppe)."
/>
