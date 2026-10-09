<script lang="ts">
	import type { Snippet } from 'svelte';
	import { zuruecksetzen } from '#lib/core/einstellungen.js';
	import { toastState } from '#lib/core/toast.svelte.js';
	import Button from '#lib/ui/Button.svelte';
	import Aufklapper from '#lib/ui/Aufklapper.svelte';
	import { nachStufe, trifft, type Abschnitt } from '../einstellungen/abschnitte.js';
	import EinstellungFeld from './EinstellungFeld.svelte';

	let {
		abschnitt,
		suche = '',
		/** Eigene Zeilen vor den erzeugten (z. B. Thema oder Pausen), die nicht aus dem Register stammen. */
		eigene,
		/** Stichwörter der eigenen Zeilen für die Suche. */
		eigeneStichwoerter = ''
	}: {
		abschnitt: Abschnitt;
		suche?: string;
		eigene?: Snippet;
		eigeneStichwoerter?: string;
	} = $props();

	const treffer = $derived(nachStufe(abschnitt.defs.filter((d) => trifft(d, suche))));
	const schnell = $derived(treffer.filter((d) => d.stufe !== 'erweitert'));
	const erweitert = $derived(treffer.filter((d) => d.stufe === 'erweitert'));
	const eigeneTreffer = $derived(
		!!eigene &&
			(!suche.trim() ||
				`${abschnitt.titel} ${eigeneStichwoerter}`
					.toLocaleLowerCase('de')
					.includes(suche.trim().toLocaleLowerCase('de')))
	);
	const sichtbar = $derived(treffer.length > 0 || eigeneTreffer);
	// Bei einer Suche liegt der Treffer nicht hinter „Mehr Optionen“ versteckt.
	let offen = $state(false);
	const erweitertOffen = $derived(offen || suche.trim() !== '');

	let nachfrage = $state(false);

	async function zuruecksetzenBestaetigt() {
		await zuruecksetzen(abschnitt.defs);
		nachfrage = false;
		toastState.success(`${abschnitt.titel}: auf Standard zurückgesetzt.`);
	}
</script>

{#if sichtbar}
	<section id={abschnitt.id} aria-labelledby="titel-{abschnitt.id}" class="box scroll-mt-20">
		<div
			class="flex flex-wrap items-center justify-between gap-2 border-b-[length:var(--rahmen)] border-tinte bg-flaeche-2 px-3 py-2"
		>
			<h2 id="titel-{abschnitt.id}" class="mono-label">{abschnitt.titel}</h2>
			{#if abschnitt.defs.length > 0}
				{#if nachfrage}
					<span class="flex items-center gap-2">
						<Button size="sm" variant="gefahr" onclick={zuruecksetzenBestaetigt}>
							Ja, zurücksetzen
						</Button>
						<Button size="sm" variant="ghost" onclick={() => (nachfrage = false)}>Abbrechen</Button>
					</span>
				{:else}
					<button
						type="button"
						class="mono-label inline-flex min-h-9 items-center underline decoration-2 underline-offset-4"
						onclick={() => (nachfrage = true)}
					>
						Zurücksetzen
					</button>
				{/if}
			{/if}
		</div>
		<p class="px-3 pt-2 text-sm text-text-2">{abschnitt.hinweis}</p>
		<div class="flex flex-col divide-y divide-tinte/20 p-1">
			{#if eigeneTreffer}{@render eigene?.()}{/if}
			{#each schnell as def (def.schluessel)}
				<EinstellungFeld {def} />
			{/each}
		</div>
		{#if erweitert.length > 0}
			<div class="p-3 pt-0">
				<Aufklapper titel="Mehr Optionen" bind:offen={() => erweitertOffen, (v) => (offen = v)}>
					<div class="flex flex-col divide-y divide-tinte/20">
						{#each erweitert as def (def.schluessel)}
							<EinstellungFeld {def} />
						{/each}
					</div>
				</Aufklapper>
			</div>
		{/if}
	</section>
{/if}
