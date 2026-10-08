<script lang="ts">
	import type { Erklaerung as ErklaerungTyp } from '#lib/core/modul.js';
	import Erklaerung from './Erklaerung.svelte';
	import Sheet from './Sheet.svelte';
	import Sticker from './Sticker.svelte';

	let {
		erklaerung,
		kontext,
		class: className = ''
	}: {
		erklaerung: ErklaerungTyp;
		/** Worauf sich das „Warum?“ bezieht, z. B. „Life Score“. Steht im zugänglichen Namen. */
		kontext: string;
		class?: string;
	} = $props();

	let offen = $state(false);
</script>

<Sticker onclick={() => (offen = true)} label="Warum: {kontext}" expanded={offen} class={className}>
	Warum?
</Sticker>

<Sheet bind:open={offen} title="Warum: {kontext}">
	<div class="p-4">
		<Erklaerung {erklaerung} />
	</div>
</Sheet>
