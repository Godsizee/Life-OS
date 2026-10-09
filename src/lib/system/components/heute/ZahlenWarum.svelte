<script lang="ts">
	import { standardDauerMin, tagesbeginn, tagesende } from '#lib/config/heute.js';
	import { wert } from '#lib/core/einstellungen.js';
	import { analyticsState } from '#lib/features/analytics/store.svelte.js';
	import WarumSticker from '#lib/ui/WarumSticker.svelte';
	import type { Tagesplan } from '../../agenda.js';
	import { scoreAnzeigen } from '../../einstellungen/score.js';
	import { kapazitaetErklaerung, scoreErklaerung } from '../../warum.js';

	let { plan }: { plan: Tagesplan } = $props();

	const score = $derived(scoreErklaerung(analyticsState.todayErgebnis));
	const kapazitaet = $derived(
		kapazitaetErklaerung(
			plan,
			{ beginn: wert(tagesbeginn), ende: wert(tagesende) },
			wert(standardDauerMin)
		)
	);
</script>

<div class="flex flex-wrap items-center gap-2" aria-label="Rechenwege der Zahlen">
	<WarumSticker kontext="Freie Zeit" zeigeKontext erklaerung={kapazitaet} />
	{#if wert(scoreAnzeigen)}
		<WarumSticker kontext="Life Score" zeigeKontext erklaerung={score} />
	{/if}
</div>
