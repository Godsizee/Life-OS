<script lang="ts">
	import type { ScorePoint } from '../score-math';
	import { scoreAverage } from '../score-math';
	import Linie from '#lib/ui/charts/Linie.svelte';

	let { scores = [] }: { scores: ScorePoint[] } = $props();

	const punkte = $derived(scores.map((s) => ({ label: s.date, value: s.total })));
	const stats = $derived(scoreAverage(scores));
</script>

<div class="flex flex-col gap-2">
	<div class="w-40">
		<Linie
			{punkte}
			min={0}
			max={100}
			hoehe={80}
			kompakt
			farbe="analytics"
			beschreibung="Life Score der letzten {stats.total} Tage, Durchschnitt {stats.avg} an {stats.tracked} erfassten Tagen"
			leerText="Noch keine Scores."
		/>
	</div>

	<p class="mono-label text-text-3">
		Ø {stats.avg} über {stats.tracked} von {stats.total} Tagen
		{#if stats.tracked < stats.total}· {stats.total - stats.tracked} Tage ohne Erfassung{/if}
	</p>
</div>
