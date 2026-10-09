<script lang="ts">
	import type { Erklaerung as ErklaerungTyp } from '#lib/core/modul.js';
	import Erklaerung from './Erklaerung.svelte';
	import Sheet from './Sheet.svelte';
	import Sticker from './Sticker.svelte';

	let {
		erklaerung,
		kontext,
		zeigeKontext = false,
		class: className = ''
	}: {
		erklaerung: ErklaerungTyp;
		/** Worauf sich das „Warum?“ bezieht, z. B. „Life Score“. Steht im zugänglichen Namen. */
		kontext: string;
		/** Zeigt den Kontext im Sticker („Warum? Life Score“), wenn mehrere nebeneinander stehen. */
		zeigeKontext?: boolean;
		class?: string;
	} = $props();

	let offen = $state(false);
</script>

<Sticker onclick={() => (offen = true)} label="Warum: {kontext}" expanded={offen} class={className}>
	Warum?{zeigeKontext ? ` ${kontext}` : ''}
</Sticker>

<Sheet bind:open={offen} title="Warum: {kontext}">
	<div class="p-4">
		<Erklaerung {erklaerung} />
	</div>
</Sheet>
