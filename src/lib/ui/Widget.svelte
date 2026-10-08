<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ModulId } from '#lib/config/modules.js';
	import type { Erklaerung as ErklaerungTyp } from '#lib/core/modul.js';
	import Erklaerung from './Erklaerung.svelte';
	import type { IconKomponente } from './icon.js';
	import Sticker from './Sticker.svelte';

	let {
		modul,
		titel,
		icon: Icon,
		menue,
		quelle,
		stand,
		warum,
		class: className = '',
		children
	}: {
		modul: ModulId;
		titel: string;
		icon?: IconKomponente;
		/** Inhalt des `⋯`-Menüs im Kopf (Snippet mit der Menütaste). */
		menue?: Snippet;
		/** Woher die Zahlen kommen, z. B. „Kalender + Aufgaben“. */
		quelle?: string;
		/** Zeitpunkt der Berechnung, z. B. „09:41“. */
		stand?: string;
		/** Mit Erklärung erscheint der Sticker `WARUM?` in der Mechanik-Zeile. */
		warum?: ErklaerungTyp;
		class?: string;
		children: Snippet;
	} = $props();

	let warumOffen = $state(false);
	const id = $props.id();
</script>

<section class="box flex flex-col {className}" aria-labelledby="{id}-titel">
	<header
		class="flex items-center gap-2 rounded-t-[calc(var(--kante-l)-var(--rahmen))] border-b-[length:var(--rahmen)] border-tinte px-3 py-2 text-auf-farbe"
		style:background-color="var(--mod-{modul})"
	>
		{#if Icon}<Icon size={16} />{/if}
		<h2 id="{id}-titel" class="mono-label min-w-0 flex-1 truncate">{titel}</h2>
		{#if menue}{@render menue()}{/if}
	</header>

	<div class="flex-1 p-3">{@render children()}</div>

	{#if quelle || stand || warum}
		<footer class="border-t-[length:var(--rahmen-s)] border-tinte px-3 py-2">
			<div class="mono-label flex flex-wrap items-center gap-x-3 gap-y-1 text-text-2">
				{#if quelle}<span>Quelle: {quelle}</span>{/if}
				{#if stand}<span>Stand {stand}</span>{/if}
				{#if warum}
					<Sticker
						onclick={() => (warumOffen = !warumOffen)}
						label="Warum: {titel}"
						expanded={warumOffen}
						class="ml-auto"
					>
						Warum?
					</Sticker>
				{/if}
			</div>
			{#if warum && warumOffen}
				<div class="mt-3 border-t-[length:var(--rahmen-s)] border-tinte pt-3">
					<Erklaerung erklaerung={warum} />
				</div>
			{/if}
		</footer>
	{/if}
</section>
